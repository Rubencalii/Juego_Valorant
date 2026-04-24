import { NextRequest, NextResponse } from "next/server";
import { getPlayerById } from "@/lib/game-logic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const player = await getPlayerById(id);
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}
