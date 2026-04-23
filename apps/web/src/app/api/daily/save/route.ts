import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { reason, chainLength, chainNodes, durationSecs } = await request.json();

    // Check if user already has a daily record for today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const existingMatch = await prisma.match.findFirst({
      where: {
        player1Id: session.userId,
        mode: "daily",
        createdAt: { gte: todayStart }
      }
    });

    if (existingMatch) {
      return NextResponse.json({ error: "Ya has completado el reto de hoy" }, { status: 403 });
    }

    const isWin = reason === "target_reached";
    
    // Save Match Record
    await prisma.match.create({
      data: {
        mode: "daily",
        player1Id: session.userId,
        winnerId: isWin ? session.userId : null,
        chainLength,
        chainNodes: JSON.stringify(chainNodes),
        durationSecs,
      }
    });

    // Update User Stats: Daily mode gives +25 ELO for win, no penalty for loss
    if (isWin) {
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          elo: { increment: 25 },
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: 1 },
        }
      });
    } else {
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          gamesPlayed: { increment: 1 }
        }
      });
    }

    return NextResponse.json({ success: true, eloChange: isWin ? 25 : 0 }, { status: 200 });

  } catch (error) {
    console.error("Save daily match error:", error);
    return NextResponse.json({ error: "Error al guardar el reto diario" }, { status: 500 });
  }
}
