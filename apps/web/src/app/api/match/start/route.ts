import { NextResponse } from "next/server";
import { pickStartingPlayer } from "@/lib/game-logic";

export async function POST() {
  const startPlayer = await pickStartingPlayer();

  if (!startPlayer) {
    return NextResponse.json({ error: "No valid starting player found" }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: crypto.randomUUID(),
    startPlayer,
  });
}
