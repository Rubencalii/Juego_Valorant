import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    // For now, let's pick 3 top teams and 3 regions/roles
    // In a production app, this would change daily using a seed.
    
    const config = {
      xAxis: [
        { type: "region", value: "Americas", label: "AMERICAS" },
        { type: "region", value: "EMEA", label: "EMEA" },
        { type: "team", value: "Sentinels", label: "SENTINELS" },
      ],
      yAxis: [
        { type: "team", value: "Fnatic", label: "FNATIC" },
        { type: "team", value: "LOUD", label: "LOUD" },
        { type: "role", value: "Player", label: "PRO PLAYER" },
      ]
    };

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch grid config" }, { status: 500 });
  }
}
