import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const players = await prisma.player.findMany({
    where: {
      OR: [
        { nickname: { contains: q } },
        { realName: { contains: q } },
      ],
    },
    select: {
      id: true,
      nickname: true,
      realName: true,
      countryCode: true,
      imageUrl: true,
    },
    take: 5,
  });

  return NextResponse.json(players);
}
