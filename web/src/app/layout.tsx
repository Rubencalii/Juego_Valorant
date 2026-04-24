import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space-grotesk" 
});

export const metadata: Metadata = {
  title: "SpikeLink.gg — Valorant Connections Game",
  description: "Connect Valorant pros who shared a team. Beat the clock. Outsmart the bot. Climb the ranks.",
  keywords: ["valorant", "esports", "game", "connections", "pro players"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
