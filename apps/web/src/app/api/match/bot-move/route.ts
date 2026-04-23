import { NextRequest, NextResponse } from "next/server";
import { getPlayerNeighbours } from "@/lib/game-logic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { currentPlayerId, usedPlayerIds } = body;

  if (!currentPlayerId) {
    return NextResponse.json({ error: "Missing currentPlayerId" }, { status: 400 });
  }

  const neighbours = await getPlayerNeighbours(currentPlayerId, usedPlayerIds || []);

  if (neighbours.length === 0) {
    return NextResponse.json({ botMove: null, noMoves: true });
  }

  // Bot picks a random valid neighbour
  const pick = neighbours[Math.floor(Math.random() * neighbours.length)];

  return NextResponse.json({
    botMove: pick,
    noMoves: false,
  });
}
