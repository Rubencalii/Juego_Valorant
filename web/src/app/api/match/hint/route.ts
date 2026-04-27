import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { currentPlayerId, usedPlayerIds, targetPlayerId } = await req.json();

    // Strategy:
    // 1. Try to find a player that connects to BOTH the current and the target (Shortest path)
    // 2. If not found, just return ANY valid connection for the current player.

    // Get valid connections for current player
    const connections = await sql`
      SELECT DISTINCT p.id, p.nickname, r2.team_id, t.name as team_name
      FROM rosters r1
      JOIN rosters r2 ON r1.team_id = r2.team_id
      JOIN players p ON r2.player_id = p.id
      JOIN teams t ON r1.team_id = t.id
      WHERE r1.player_id = ${currentPlayerId}
      AND p.id != ${currentPlayerId}
      AND p.id NOT IN (${usedPlayerIds.length > 0 ? sql(usedPlayerIds) : 0})
    `;

    if (connections.length === 0) {
      return NextResponse.json({ error: "No valid connections found" }, { status: 404 });
    }

    // Check if any connection leads directly to target
    const toTarget = connections.find(c => c.id === targetPlayerId);
    if (toTarget) {
      return NextResponse.json({ 
        hintType: "connection",
        player: toTarget,
        message: "¡Este jugador conecta directamente con la meta!"
      });
    }

    // Random hint from valid connections
    const randomHint = connections[Math.floor(Math.random() * connections.length)];

    return NextResponse.json({
      hintType: "player",
      player: randomHint,
      message: `Prueba con ${randomHint.nickname}, compartió equipo en ${randomHint.team_name}`
    });

  } catch (error) {
    console.error("Hint API error:", error);
    return NextResponse.json({ error: "Failed to fetch hint" }, { status: 500 });
  }
}
