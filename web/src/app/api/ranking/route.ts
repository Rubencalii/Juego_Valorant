import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

/**
 * GET /api/ranking?scope=global|weekly|daily&page=1&limit=20
 * Returns paginated rankings.
 */
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope") || "global";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    let users;
    let total;

    if (scope === "weekly") {
      // Weekly: only matches from last 7 days
      users = await sql`
        SELECT u.id, u.nickname, u.avatar_url, u.elo,
          COUNT(m.id) AS total_matches,
          COUNT(CASE WHEN m.winner_id = u.id THEN 1 END) AS wins,
          MAX(m.chain_length) AS best_chain
        FROM users u
        LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
          AND m.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY u.id, u.nickname, u.avatar_url, u.elo
        ORDER BY wins DESC, u.elo DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const countResult = await sql`SELECT COUNT(*) AS count FROM users`;
      total = countResult[0]?.count || 0;
    } else {
      // Global: by ELO
      users = await sql`
        SELECT u.id, u.nickname, u.avatar_url, u.elo,
          COUNT(m.id) AS total_matches,
          COUNT(CASE WHEN m.winner_id = u.id THEN 1 END) AS wins,
          MAX(m.chain_length) AS best_chain
        FROM users u
        LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
        GROUP BY u.id, u.nickname, u.avatar_url, u.elo
        ORDER BY u.elo DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const countResult = await sql`SELECT COUNT(*) AS count FROM users`;
      total = countResult[0]?.count || 0;
    }

    return NextResponse.json({
      scope,
      page,
      limit,
      total: Number(total),
      users: users.map((u: Record<string, unknown>, i: number) => ({
        rank: offset + i + 1,
        id: u.id,
        nickname: u.nickname,
        avatar_url: u.avatar_url,
        elo: u.elo,
        total_matches: Number(u.total_matches),
        wins: Number(u.wins),
        best_chain: u.best_chain || 0,
      })),
    });
  } catch (error) {
    console.error("Ranking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
