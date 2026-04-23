import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateConnection } from "@/lib/game-logic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { currentPlayerId, guessedPlayerName, usedPlayerIds } = body;

  if (!currentPlayerId || !guessedPlayerName) {
    return NextResponse.json({ valid: false, reason: "MISSING_PARAMS" }, { status: 400 });
  }

  // Find the guessed player by nickname (case-insensitive)
  const guessedPlayer = await prisma.player.findFirst({
    where: {
      OR: [
        { nickname: { equals: guessedPlayerName } },
        { nickname: { contains: guessedPlayerName } },
      ],
    },
  });

  if (!guessedPlayer) {
    return NextResponse.json({ valid: false, reason: "NOT_FOUND" });
  }

  const result = await validateConnection(
    currentPlayerId,
    guessedPlayer.id,
    usedPlayerIds || []
  );

  if (result.valid) {
    return NextResponse.json({
      valid: true,
      sharedTeam: result.sharedTeam,
      newPlayerId: guessedPlayer.id,
      newPlayer: {
        id: guessedPlayer.id,
        nickname: guessedPlayer.nickname,
        realName: guessedPlayer.realName,
        countryCode: guessedPlayer.countryCode,
        imageUrl: guessedPlayer.imageUrl,
      },
    });
  }

  return NextResponse.json(result);
}
