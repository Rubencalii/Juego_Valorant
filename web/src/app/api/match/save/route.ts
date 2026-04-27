import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";
import { verifyChain } from "@/lib/game-logic";

/**
 * POST /api/match/save
 * Saves the result of a match and updates user ELO.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Log in to save progress." },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    const body = await req.json();
    const { mode, chainLength, result, durationSecs, chainNodes } = body;

    if (!userId || !result) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // --- SECURITY PATCH: Verify Chain ---
    if (result === "win") {
      const isValid = await verifyChain(chainNodes);
      if (!isValid) {
        console.warn(`SECURITY ALERT: User ${userId} tried to spoof a win with invalid chain:`, chainNodes);
        return NextResponse.json({ error: "Invalid connection chain detected." }, { status: 403 });
      }
    }

    // --- SECURITY PATCH: Daily Limit ---
    if (mode === "daily") {
      const today = new Date().toISOString().split('T')[0];
      const alreadyPlayed = await sql`
        SELECT 1 FROM matches 
        WHERE player1_id = ${userId} 
          AND mode = 'daily' 
          AND created_at::date = ${today}::date
        LIMIT 1
      `;
      if (alreadyPlayed.length > 0) {
        return NextResponse.json({ error: "Daily challenge already completed." }, { status: 429 });
      }
    }

    // 1. Calculate ELO Change
    let eloChange = 0;
    if (result === "win") {
      if (mode === "daily") eloChange = 25;
      else if (mode === "bot") eloChange = 10;
      else eloChange = 20; 
    } else {
      eloChange = -5;
    }

    // 2. Update User ELO and Stats
    const finalElo = await sql.begin(async (sql) => {
      await sql`
        UPDATE users 
        SET elo = GREATEST(0, elo + ${eloChange}),
            total_points = total_points + ${Math.max(0, eloChange * 5)}
        WHERE id = ${userId}
      `;

      await sql`
        INSERT INTO matches (mode, player1_id, winner_id, chain_length, chain_nodes, duration_secs)
        VALUES (
          ${mode}, 
          ${userId}, 
          ${result === "win" ? userId : null}, 
          ${chainLength}, 
          ${chainNodes || []}, 
          ${durationSecs}
        )
      `;
      
      return sql`SELECT elo FROM users WHERE id = ${userId}`;
    });

    return NextResponse.json({
      success: true,
      eloChange,
      newElo: finalElo[0].elo
    });
  } catch (error) {
    console.error("Match save error:", error);
    return NextResponse.json(
      { error: "Failed to save match result" },
      { status: 500 }
    );
  }
}

