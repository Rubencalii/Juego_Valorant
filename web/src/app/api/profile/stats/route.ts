import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/stats
 * Returns stats for the authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const stats = await sql`
      SELECT 
        u.elo,
        COUNT(m.id) AS total_matches,
        COUNT(CASE WHEN m.winner_id = ${userId} THEN 1 END) AS wins,
        COALESCE(MAX(m.chain_length), 0) AS best_chain
      FROM users u
      LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
      WHERE u.id = ${userId}
      GROUP BY u.id, u.elo
    `;

    if (!stats.length) {
      return NextResponse.json({
        elo: 1000,
        total_matches: 0,
        wins: 0,
        best_chain: 0,
      });
    }

    return NextResponse.json({
      elo: stats[0].elo,
      total_matches: Number(stats[0].total_matches),
      wins: Number(stats[0].wins),
      best_chain: Number(stats[0].best_chain),
    });
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
