import { NextRequest, NextResponse } from "next/server";
import { validateConnection, findPlayerByName } from "@/lib/game-logic";

/**
 * POST /api/match/verify
 * Validates a connection between two players.
 * 
 * Body: { currentPlayerId: number, guessedPlayerName: string, usedPlayerIds: number[] }
 * 
 * Success: { valid: true, sharedTeam: "LOUD", newPlayerId: 456, newPlayerData: {...} }
 * Error:   { valid: false, reason: "NEVER_PLAYED" | "ALREADY_USED" | "NOT_FOUND" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentPlayerId, guessedPlayerName, usedPlayerIds } = body;

    // Validate input
    if (!currentPlayerId || !guessedPlayerName) {
      return NextResponse.json(
        { error: "currentPlayerId and guessedPlayerName are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(usedPlayerIds)) {
      return NextResponse.json(
        { error: "usedPlayerIds must be an array" },
        { status: 400 }
      );
    }

    // Find the guessed player by name
    const guessedPlayer = await findPlayerByName(guessedPlayerName);

    if (!guessedPlayer) {
      return NextResponse.json({
        valid: false,
        reason: "NOT_FOUND",
      });
    }

    // Validate the connection
    const result = await validateConnection(
      currentPlayerId,
      guessedPlayer.id,
      usedPlayerIds
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Match verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify connection" },
      { status: 500 }
    );
  }
}
