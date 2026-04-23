import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json({ error: "Nickname y contraseña son requeridos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { nickname: nickname.trim() }
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, nickname: user.nickname });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        elo: user.elo,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        bestChain: user.bestChain,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error en el inicio de sesión" }, { status: 500 });
  }
}
