import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/game-logic";

/**
 * GET /api/players?q=<query>
 * Autocomplete endpoint for player search (RF-11, RF-12).
 * Returns up to 5 matching players.
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");

    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const players = await searchPlayers(query.trim(), 5);

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Player search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
