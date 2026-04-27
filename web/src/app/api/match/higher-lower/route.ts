import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("exclude");

    // Get 2 random players with their maps_played
    const players = await sql`
      SELECT p.id, p.nickname, p.image_url, COALESCE(SUM(r.maps_played), 0) as maps_played
      FROM players p
      JOIN rosters r ON p.id = r.player_id
      WHERE p.id != ${excludeId ? parseInt(excludeId) : 0}
      GROUP BY p.id, p.nickname, p.image_url
      HAVING SUM(r.maps_played) > 5
      ORDER BY RANDOM()
      LIMIT 2
    `;

    if (players.length < 2) {
      return NextResponse.json({ error: "Not enough players" }, { status: 404 });
    }

    return NextResponse.json({
      playerA: {
        id: players[0].id,
        nickname: players[0].nickname,
        image_url: players[0].image_url,
        value: parseInt(players[0].maps_played)
      },
      playerB: {
        id: players[1].id,
        nickname: players[1].nickname,
        image_url: players[1].image_url,
        value: parseInt(players[1].maps_played)
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
