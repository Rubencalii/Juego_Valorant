import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    // Get all players that have a team
    const players = await sql`
      SELECT p.id, p.nickname, p.country_code, t.name as team_name, t.region
      FROM players p
      JOIN rosters r ON p.id = r.player_id
      JOIN teams t ON r.team_id = t.id
      WHERE r.year_start = 2024
      LIMIT 100
    `;

    if (players.length === 0) {
      return NextResponse.json({ error: "No players found" }, { status: 404 });
    }

    // Seed based on date
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((acc, part) => acc + parseInt(part), 0);
    const dailyPlayer = players[seed % players.length];

    return NextResponse.json({ player: dailyPlayer });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch daily player" }, { status: 500 });
  }
}
