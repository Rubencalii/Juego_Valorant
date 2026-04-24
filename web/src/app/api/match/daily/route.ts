import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getRandomStartNode } from "@/lib/game-logic";

/**
 * GET /api/match/daily
 * Daily Challenge Mode
 * Uses a deterministic seed (based on current date YYYY-MM-DD) to select
 * the exact same starting player for everyone globally.
 */
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Convert today's date string into a deterministic seed integer
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = Math.imul(31, hash) + today.charCodeAt(i) | 0;
    }
    const seed = Math.abs(hash);

    // Get a player deterministically using Postgres SETSEED
    await sql`SELECT setseed(${seed / 2147483647})`; // Postgres setseed expects float [-1, 1]
    
    const startPlayer = await getRandomStartNode(5);

    if (!startPlayer) {
      return NextResponse.json(
        { error: "No suitable starting player found." },
        { status: 503 }
      );
    }

    const sessionId = `daily-${today}`;

    return NextResponse.json({
      sessionId,
      mode: "daily",
      startPlayer,
      timeLimit: 15,
      date: today
    });
  } catch (error) {
    console.error("Daily match error:", error);
    return NextResponse.json(
      { error: "Failed to start daily match" },
      { status: 500 }
    );
  }
}
