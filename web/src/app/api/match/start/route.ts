import { NextRequest, NextResponse } from "next/server";
import { getRandomStartNode } from "@/lib/game-logic";
/**
 * POST /api/match/start
 * Starts a new match session.
 * Returns the starting player node (with ≥5 connections) and a session ID.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "bot";

    // Get a random starting player with enough connections
    const startPlayer = await getRandomStartNode(5);

    if (!startPlayer) {
      return NextResponse.json(
        { error: "No suitable starting player found. Database may be empty." },
        { status: 503 }
      );
    }

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    return NextResponse.json({
      sessionId,
      mode,
      startPlayer,
      timeLimit: 15,
    });
  } catch (error) {
    console.error("Match start error:", error);
    return NextResponse.json(
      { error: "Failed to start match" },
      { status: 500 }
    );
  }
}
