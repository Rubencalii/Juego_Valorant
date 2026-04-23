import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const topPlayers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        elo: "desc",
      },
      select: {
        id: true,
        nickname: true,
        elo: true,
        gamesPlayed: true,
        bestChain: true,
      }
    });

    return NextResponse.json({ leaderboard: topPlayers }, { status: 200 });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Error al obtener ranking" }, { status: 500 });
  }
}
