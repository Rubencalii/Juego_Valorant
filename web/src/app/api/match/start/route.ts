import { NextRequest, NextResponse } from "next/server";
import { getTargetMatchNodes } from "@/lib/game-logic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "bot";

    // Get a start and target pair
    const nodes = await getTargetMatchNodes();

    if (!nodes) {
      return NextResponse.json(
        { error: "No suitable start/target pair found." },
        { status: 503 }
      );
    }

    const { start: startPlayer, target: targetPlayer } = nodes;

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    return NextResponse.json({
      sessionId,
      mode,
      startPlayer,
      targetPlayer,
      timeLimit: 15,
    });

  } catch (error) {
    console.error("Match start error:", error);
    return NextResponse.json(
      { error: "Failed to start match" },
      { status: 500 }
    );
  }
}
