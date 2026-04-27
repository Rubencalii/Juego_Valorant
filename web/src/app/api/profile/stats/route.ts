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
        u.total_points,
        u.title,
        u.banner_color,
        COUNT(m.id) AS total_matches,
        COUNT(CASE WHEN m.winner_id = ${userId} THEN 1 END) AS wins,
        COALESCE(MAX(m.chain_length), 0) AS best_chain
      FROM users u
      LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
      WHERE u.id = ${userId}
      GROUP BY u.id, u.elo, u.total_points, u.title, u.banner_color
    `;

    const lastMatches = await sql`
      SELECT 
        id,
        mode,
        winner_id,
        chain_length,
        created_at
      FROM matches
      WHERE player1_id = ${userId} OR player2_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const getRank = (elo: number) => {
      if (elo >= 2901) return "Radiante";
      if (elo >= 2601) return "Inmortal";
      if (elo >= 2301) return "Ascendente";
      if (elo >= 2001) return "Diamante";
      if (elo >= 1701) return "Platino";
      if (elo >= 1401) return "Oro";
      if (elo >= 1101) return "Plata";
      if (elo >= 801) return "Bronce";
      return "Hierro";
    };

    const userElo = stats[0]?.elo || 1000;

    return NextResponse.json({
      elo: userElo,
      rank_name: getRank(userElo),
      total_points: Number(stats[0]?.total_points || 0),
      title: stats[0]?.title || "AGENTE NOVATO",
      banner_color: stats[0]?.banner_color || "#FF4655",
      total_matches: Number(stats[0]?.total_matches || 0),
      wins: Number(stats[0]?.wins || 0),
      best_chain: Number(stats[0]?.best_chain || 0),
      last_matches: lastMatches.map(m => ({
        ...m,
        result: m.winner_id === userId ? "WIN" : (m.winner_id ? "LOSS" : "DRAW")
      }))
    });
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
