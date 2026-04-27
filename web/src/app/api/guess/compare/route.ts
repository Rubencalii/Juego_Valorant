import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { nickname } = await req.json();

    // 1. Get the guessed player
    const guessedPlayers = await sql`
      SELECT p.id, p.nickname, p.country_code, p.image_url, t.name as team_name, t.region, r.role
      FROM players p
      LEFT JOIN rosters r ON p.id = r.player_id
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE p.nickname ILIKE ${nickname}
      ORDER BY r.year_start DESC
      LIMIT 1
    `;

    if (guessedPlayers.length === 0) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const guessed = guessedPlayers[0];

    // 2. Get the daily target (re-calculating to keep it stateless or use a dedicated table)
    const players = await sql`
      SELECT p.id, p.nickname, p.country_code, t.name as team_name, t.region, r.role
      FROM players p
      JOIN rosters r ON p.id = r.player_id
      JOIN teams t ON r.team_id = t.id
      WHERE r.year_start = 2024
      LIMIT 100
    `;
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((acc, part) => acc + parseInt(part), 0);
    const target = players[seed % players.length];

    // 3. Compare attributes
    const result = {
      id: guessed.id,
      nickname: guessed.nickname,
      image_url: guessed.image_url,
      team: {
        name: guessed.team_name || "Free Agent",
        status: guessed.team_name === target.team_name ? "correct" : "wrong"
      },
      region: {
        name: guessed.region || "N/A",
        status: guessed.region === target.region ? "correct" : "wrong"
      },
      country: {
        name: guessed.country_code || "N/A",
        status: guessed.country_code === target.country_code ? "correct" : "wrong"
      },
      role: {
        name: guessed.role || "Player",
        status: guessed.role === target.role ? "correct" : "wrong"
      }
    };

    // Partial match for team if they played together or same region but different team?
    // Actually, "partial" in team could mean they played in that team in the past.
    if (result.team.status === "wrong") {
        const pastTeam = await sql`
            SELECT id FROM rosters 
            WHERE player_id = ${target.id} AND team_id = (SELECT id FROM teams WHERE name = ${guessed.team_name})
        `;
        if (pastTeam.length > 0) result.team.status = "partial";
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
