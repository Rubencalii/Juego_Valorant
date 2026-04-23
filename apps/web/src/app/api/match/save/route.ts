import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { reason, chainLength, chainNodes, durationSecs, score } = await request.json();

    // Determine result and ELO changes
    let eloChange = 0;
    let isWin = false;

    if (reason === "bot_stuck") {
      eloChange = 15;
      isWin = true;
    } else if (reason === "timeout" || reason === "errors") {
      eloChange = -10;
    } else if (reason === "player_stuck") {
      eloChange = -5;
    }

    // Save Match Record
    const match = await prisma.match.create({
      data: {
        mode: "bot",
        player1Id: session.userId,
        winnerId: isWin ? session.userId : null,
        chainLength,
        chainNodes: JSON.stringify(chainNodes),
        durationSecs,
      }
    });

    // Update User Stats
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    
    if (user) {
      const newElo = Math.max(0, user.elo + eloChange); // ELO cannot be negative
      const newGamesPlayed = user.gamesPlayed + 1;
      const newGamesWon = isWin ? user.gamesWon + 1 : user.gamesWon;
      const newBestChain = Math.max(user.bestChain, chainLength);

      await prisma.user.update({
        where: { id: session.userId },
        data: {
          elo: newElo,
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          bestChain: newBestChain,
        }
      });
    }

    return NextResponse.json({ success: true, eloChange }, { status: 200 });

  } catch (error) {
    console.error("Save match error:", error);
    return NextResponse.json({ error: "Error al guardar partida" }, { status: 500 });
  }
}
