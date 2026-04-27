import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { title, cost } = await req.json();

    // 1. Check points
    const user = await sql`SELECT total_points FROM users WHERE id = ${userId}`;
    if (!user[0] || user[0].total_points < cost) {
      return NextResponse.json({ error: "No tienes suficientes puntos" }, { status: 400 });
    }

    // 2. Deduct points and update title
    await sql`
      UPDATE users 
      SET total_points = total_points - ${cost},
          title = ${title.toUpperCase()}
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, newTitle: title });
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
