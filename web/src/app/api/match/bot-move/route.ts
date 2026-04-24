import { NextRequest, NextResponse } from "next/server";
import { getBotMove } from "@/lib/game-logic";

/**
 * POST /api/match/bot-move
 * Bot AI: selects a random valid neighbor not yet used in the chain.
 * 
 * Body: { currentPlayerId: number, usedPlayerIds: number[] }
 * Response: { player: PlayerData, sharedTeam: string } or { player: null }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentPlayerId, usedPlayerIds } = body;

    if (!currentPlayerId || !Array.isArray(usedPlayerIds)) {
      return NextResponse.json(
        { error: "currentPlayerId and usedPlayerIds are required" },
        { status: 400 }
      );
    }

    const result = await getBotMove(currentPlayerId, usedPlayerIds);

    if (!result) {
      return NextResponse.json({ player: null });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bot move error:", error);
    return NextResponse.json(
      { error: "Failed to compute bot move" },
      { status: 500 }
    );
  }
}
