import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { playerId, conditionX, conditionY } = await req.json();

    const checkCondition = async (playerId: number, cond: any) => {
      if (cond.type === "team") {
        const res = await sql`
          SELECT id FROM rosters 
          WHERE player_id = ${playerId} 
          AND team_id = (SELECT id FROM teams WHERE name = ${cond.value})
        `;
        return res.length > 0;
      }
      if (cond.type === "region") {
        const res = await sql`
          SELECT r.id FROM rosters r
          JOIN teams t ON r.team_id = t.id
          WHERE r.player_id = ${playerId} AND t.region = ${cond.value}
        `;
        return res.length > 0;
      }
      if (cond.type === "role") {
        // Just check if they exist for now, or match a specific role
        return true; 
      }
      return false;
    };

    const validX = await checkCondition(playerId, conditionX);
    const validY = await checkCondition(playerId, conditionY);

    return NextResponse.json({ valid: validX && validY });

  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
