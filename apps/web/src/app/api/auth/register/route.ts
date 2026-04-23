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

    if (nickname.length < 3 || password.length < 6) {
      return NextResponse.json({ error: "El nickname debe tener al menos 3 caracteres y la contraseña 6" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { nickname: nickname.trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        nickname: nickname.trim(),
        passwordHash,
      }
    });

    const token = await signToken({ userId: user.id, nickname: user.nickname });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, nickname: user.nickname, elo: user.elo }
    }, { status: 201 });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error en el registro" }, { status: 500 });
  }
}
