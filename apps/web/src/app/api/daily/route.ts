import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDailyChallenge } from "@/lib/daily-logic";

export async function GET() {
  try {
    const session = await getSession();
    const challenge = await getDailyChallenge();

    if (!challenge.startPlayer || !challenge.targetPlayer) {
      return NextResponse.json({ error: "No se pudo generar el desafío diario" }, { status: 500 });
    }

    // Check if user has already played today
    let hasPlayed = false;
    let previousResult = null;

    if (session) {
      // Find a daily match from today
      // Match createdAt >= start of today UTC
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const existingMatch = await prisma.match.findFirst({
        where: {
          player1Id: session.userId,
          mode: "daily",
          createdAt: {
            gte: todayStart
          }
        }
      });

      if (existingMatch) {
        hasPlayed = true;
        previousResult = {
          chainLength: existingMatch.chainLength,
          chainNodes: JSON.parse(existingMatch.chainNodes),
          won: existingMatch.winnerId === session.userId
        };
      }
    }

    return NextResponse.json({
      startPlayer: challenge.startPlayer,
      targetPlayer: challenge.targetPlayer,
      dateStr: challenge.dateStr,
      hasPlayed,
      previousResult
    }, { status: 200 });

  } catch (error) {
    console.error("Daily challenge error:", error);
    return NextResponse.json({ error: "Error al cargar reto diario" }, { status: 500 });
  }
}
