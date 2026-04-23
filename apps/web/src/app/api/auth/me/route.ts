import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        elo: true,
        gamesPlayed: true,
        gamesWon: true,
        bestChain: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
