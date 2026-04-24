import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import sql from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        nickname: { label: "Nickname", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nickname || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const users = await sql`
          SELECT * FROM users WHERE nickname = ${credentials.nickname}
        `;

        const user = users[0];

        if (!user || !user.password_hash) {
          throw new Error("Invalid nickname or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid nickname or password");
        }

        return {
          id: user.id,
          name: user.nickname,
          email: user.email,
          image: user.avatar_url,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    }
  }
};
