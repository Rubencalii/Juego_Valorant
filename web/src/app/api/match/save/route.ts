import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

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

    // 1. Calculate ELO Change
    let eloChange = 0;
    if (result === "win") {
      if (mode === "daily") eloChange = 25;
      else if (mode === "bot") eloChange = 10;
      else eloChange = 20; // Default for other modes
    } else {
      // Small penalty for losses
      eloChange = -5;
    }

    // 2. Update User ELO and Save Match in a transaction
    await sql.begin(async (sql) => {
      // Update ELO
      await sql`
        UPDATE users 
        SET elo = GREATEST(0, elo + ${eloChange})
        WHERE id = ${userId}
      `;

      // Save Match Record
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
    });

    return NextResponse.json({
      success: true,
      eloChange,
      newElo: await sql`SELECT elo FROM users WHERE id = ${userId}`.then(r => r[0].elo)
    });
  } catch (error) {
    console.error("Match save error:", error);
    return NextResponse.json(
      { error: "Failed to save match result" },
      { status: 500 }
    );
  }
}
