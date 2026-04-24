import { createServer } from "http";
import { Server } from "socket.io";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: "../../web/.env.local" });

const sql = postgres(process.env.DATABASE_URL);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map(); // roomId -> roomData
const queue = []; // Array of { userId, nickname, elo, socketId }

io.on("connection", (socket) => {
  console.log("Agent connected:", socket.id);

  socket.on("join_queue", async ({ userId, nickname, elo }) => {
    // SECURITY: Tie the socket to a specific userId to prevent impersonation in subsequent events
    socket.data.userId = userId;
    socket.data.nickname = nickname;

    if (queue.find(u => u.userId === userId)) return;

    console.log(`User ${nickname} (${elo} ELO) joined matchmaking queue`);
    
    // Look for opponent (ELO range +/- 200)
    const opponentIndex = queue.findIndex(u => Math.abs(u.elo - elo) <= 200);

    if (opponentIndex !== -1) {
      const opponent = queue.splice(opponentIndex, 1)[0];
      const roomId = `RANKED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Fetch nodes from DB directly
      const startPlayer = await sql`
        SELECT p.id, p.nickname, p.image_url FROM players p
        JOIN rosters r ON r.player_id = p.id
        GROUP BY p.id ORDER BY RANDOM() LIMIT 1
      `.then(r => r[0]);

      const targetPlayer = await sql`
        SELECT p.id, p.nickname, p.image_url FROM players p
        JOIN rosters r ON r.player_id = p.id
        WHERE p.id != ${startPlayer.id}
        GROUP BY p.id ORDER BY RANDOM() LIMIT 1
      `.then(r => r[0]);

      const roomData = {
        id: roomId,
        host: opponent,
        guest: { id: userId, nickname, socketId: socket.id, elo },
        eloBet: 20,
        status: "starting",
        mode: "ranked",
        gameState: { startPlayer, targetPlayer }
      };
      
      rooms.set(roomId, roomData);
      
      const payload = { 
        roomId, 
        startId: startPlayer.id, 
        targetId: targetPlayer.id 
      };

      io.to(opponent.socketId).emit("match_found", { ...payload, opponent: nickname });
      socket.emit("match_found", { ...payload, opponent: opponent.nickname });
      
      console.log(`Ranked Match Created: ${roomId}`);
    } else {

      queue.push({ userId, nickname, elo, socketId: socket.id });
    }
  });

  socket.on("leave_queue", ({ userId }) => {
    const index = queue.findIndex(u => u.userId === userId);
    if (index !== -1) queue.splice(index, 1);
  });

  socket.on("create_room", async ({ userId, nickname, eloBet }) => {
    socket.data.userId = userId;
    socket.data.nickname = nickname;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms.set(roomId, {
      id: roomId,
      host: { id: userId, nickname, socketId: socket.id },
      guest: null,
      eloBet: parseInt(eloBet),
      status: "waiting",
      gameState: null
    });
    socket.join(roomId);
    socket.emit("room_created", { roomId });
    console.log(`Room ${roomId} created by ${nickname}`);
  });

  socket.on("join_room", ({ roomId, userId, nickname }) => {
    const room = rooms.get(roomId);
    if (!room) {
      return socket.emit("error", { message: "Sala no encontrada" });
    }
    if (room.status !== "waiting") {
      return socket.emit("error", { message: "La sala está llena o ya empezó" });
    }

    room.guest = { id: userId, nickname, socketId: socket.id };
    room.status = "starting";
    socket.join(roomId);

    io.to(roomId).emit("match_starting", { 
      host: room.host.nickname, 
      guest: room.guest.nickname,
      eloBet: room.eloBet,
      isHost: true // Temporary flag to tell someone to fetch data
    });

    console.log(`User ${nickname} joined room ${roomId}`);
  });

  socket.on("start_match", ({ roomId, startPlayer, targetPlayer }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.gameState = { startPlayer, targetPlayer };
    socket.to(roomId).emit("match_data", { startPlayer, targetPlayer });
  });

  socket.on("submit_move", ({ roomId, playerId, nickname, newPlayerId, newNickname, sharedTeam }) => {
    // SECURITY: Verify the player making the move is the one who connected the socket
    if (socket.data.userId !== playerId) {
      console.warn(`SECURITY ALERT: Socket ${socket.id} tried to move as ${playerId}`);
      return;
    }
    const room = rooms.get(roomId);
    if (!room) return;

    // Broadcast the move to the opponent
    socket.to(roomId).emit("opponent_move", { 
      playerId, 
      nickname, 
      newPlayerId, 
      newNickname, 
      sharedTeam 
    });
  });

async function verifyChain(playerIds) {
  if (!playerIds || playerIds.length < 2) return false;
  for (let i = 0; i < playerIds.length - 1; i++) {
    const p1 = playerIds[i];
    const p2 = playerIds[i + 1];
    const shared = await sql`
      SELECT 1 FROM rosters r1
      JOIN rosters r2 ON r1.team_id = r2.team_id
      WHERE r1.player_id = ${p1} AND r2.player_id = ${p2}
      LIMIT 1
    `;
    if (!shared.length) return false;
  }
  return true;
}

socket.on("win_match", async ({ roomId, userId, chainLength, durationSecs, chainNodes }) => {
    // SECURITY: Verify the player winning is the one who connected the socket
    if (socket.data.userId !== userId) {
      console.warn(`SECURITY ALERT: Socket ${socket.id} tried to win as ${userId}`);
      return;
    }

    const room = rooms.get(roomId);
    if (!room || room.status === "finished") return;

    // SECURITY: Verify the chain nodes
    const isValid = await verifyChain(chainNodes);
    if (!isValid) {
      console.warn(`SECURITY ALERT: Invalid chain detected in match ${roomId}`);
      return;
    }

    room.status = "finished";
    const winnerId = userId;
    const isHostWinner = room.host.id === winnerId;
    const loserId = isHostWinner ? room.guest.id : room.host.id;
    const eloWin = room.eloBet;

    io.to(roomId).emit("game_over", { 
      winnerId, 
      winnerNickname: isHostWinner ? room.host.nickname : room.guest.nickname 
    });

    // Update ELO in DB
    try {
      await sql.begin(async (sql) => {
        // Winner gets his bet + loser's bet
        await sql`UPDATE users SET elo = elo + ${eloWin} WHERE id = ${winnerId}`;
        await sql`UPDATE users SET elo = GREATEST(0, elo - ${eloWin}) WHERE id = ${loserId}`;
        
        // Save Match Record
        await sql`
          INSERT INTO matches (mode, player1_id, player2_id, winner_id, chain_length, chain_nodes, duration_secs)
          VALUES ('pvp_private', ${room.host.id}, ${room.guest.id}, ${winnerId}, ${chainLength}, ${chainNodes}, ${durationSecs})
        `;
      });
      console.log(`Match ${roomId} finished. Winner: ${winnerId}`);
    } catch (err) {
      console.error("Failed to update ELO for PVP match:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Agent disconnected:", socket.id);
    // Handle mid-game disconnects?
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Multiplayer Socket Server running on port ${PORT}`);
});
