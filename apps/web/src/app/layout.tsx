import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpikeLink — Conecta jugadores de Valorant",
  description:
    "El juego de conexiones del ecosistema competitivo de Valorant. Encadena jugadores profesionales que hayan compartido equipo contra un temporizador de 15 segundos.",
  keywords: ["valorant", "esports", "connections", "game", "spikelink", "vct"],
  openGraph: {
    title: "SpikeLink",
    description: "El juego de conexiones de Valorant",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
