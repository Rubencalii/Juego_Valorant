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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
