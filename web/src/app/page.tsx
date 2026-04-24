"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const GAME_MODES = [
  {
    id: "bot",
    title: "ENTRENAMIENTO",
    subtitle: "VS BOT",
    description: "Practica contra la IA. Perfecto para aprender las conexiones.",
    icon: "🤖",
    href: "/play?mode=bot",
    color: "#02e600",
    available: true,
  },
  {
    id: "daily",
    title: "CADENA DEL DÍA",
    subtitle: "DAILY CHALLENGE",
    description: "Cadena diaria compartida. ¿Cuántos nodos puedes conectar?",
    icon: "📅",
    href: "/play?mode=daily",
    color: "#FFB3B2",
    available: true,
  },
  {
    id: "pvp_private",
    title: "1V1 PRIVADO",
    subtitle: "PRIVATE DUEL",
    description: "Desafía a un amigo, apuesta tu ELO y gana su recompensa.",
    icon: "⚔️",
    href: "/play/pvp",
    color: "#FF4655",
    available: true,
  },
  {
    id: "matchmaking",
    title: "MATCHMAKING",
    subtitle: "RANKED PVP",
    description: "Emparejamiento por ELO. Demuestra quién es el mejor agente.",
    icon: "🎮",
    href: "/play/matchmaking",
    color: "#02e600",
    available: true,
  },
];

export default function HubPage() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col relative overflow-hidden font-body">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />

      {/* Diagonal background pattern */}
      <div className="absolute inset-0 pointer-events-none diagonal-bg opacity-100" />

      <div className="w-full max-w-5xl mx-auto px-4 pt-28 pb-32 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] font-display font-bold text-[#FF4655] uppercase tracking-[0.5em] mb-4">
            <span className="inline-block w-2 h-2 bg-[#FF4655] animate-pulse mr-2" />
            SPIKELINK_OS://V.1.0 // 
            {status === "authenticated" 
              ? `AGENT: ${session?.user?.name?.toUpperCase()}`
              : "SESSION: GUEST"
            }
          </div>

          <h1 className="font-display font-black text-5xl md:text-7xl uppercase tracking-tight italic mb-4">
            SPIKE<span className="text-[#FF4655]">LINK</span>
          </h1>

          <p className="font-body text-[#ECE8E1]/50 text-sm md:text-base max-w-xl mx-auto">
            Conecta jugadores profesionales de Valorant que hayan compartido equipo. 
            Cada conexión correcta reinicia el reloj. Un error significa la derrota.
          </p>
        </motion.div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {GAME_MODES.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {mode.available ? (
                <Link href={mode.href} className="block group">
                  <GameModeCard mode={mode} />
                </Link>
              ) : (
                <div className="opacity-50 cursor-not-allowed">
                  <GameModeCard mode={mode} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Stats preview if logged in */}
        {status === "authenticated" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border border-[#ECE8E1]/10 bg-[#17202b] p-6"
          >
            <div className="text-[10px] font-display font-bold text-[#ECE8E1]/40 uppercase tracking-[0.3em] mb-4">
              AGENT STATS // {session?.user?.name?.toUpperCase()}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="ELO" value="1000" />
              <StatBox label="WINS" value="0" />
              <StatBox label="BEST CHAIN" value="0" />
              <StatBox label="MATCHES" value="0" />
            </div>
          </motion.div>
        )}

        {/* Guest CTA */}
        {status === "unauthenticated" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center border border-[#ECE8E1]/10 bg-[#17202b] p-8"
          >
            <p className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/50 mb-4">
              Inicia sesión para guardar tu progreso y competir en el ranking
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/login"
                className="font-display font-black text-xs uppercase tracking-[0.2em] text-[#FF4655] border border-[#FF4655] px-6 py-2 hover:bg-[#FF4655]/10 transition-all"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                className="font-display font-black text-xs uppercase tracking-[0.2em] bg-[#FF4655] text-[#ECE8E1] px-6 py-2 hover:bg-[#FF4655]/90 transition-all"
              >
                REGISTER
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function GameModeCard({ mode }: { mode: typeof GAME_MODES[0] }) {
  return (
    <div className="relative bg-[#17202b] border border-[#ECE8E1]/10 p-6 group-hover:border-[#FF4655]/50 transition-all overflow-hidden">
      {/* Corner accent */}
      <div 
        className="absolute top-0 right-0 w-12 h-12 opacity-20 transition-opacity group-hover:opacity-40"
        style={{ background: `linear-gradient(135deg, transparent 50%, ${mode.color} 50%)` }}
      />

      <div className="flex items-start gap-4">
        <span className="text-3xl">{mode.icon}</span>
        <div className="flex-1">
          <div className="font-display font-black text-xl uppercase tracking-tight text-[#ECE8E1] group-hover:text-[#FF4655] transition-colors">
            {mode.title}
          </div>
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[#ECE8E1]/30 mb-2">
            {mode.subtitle}
          </div>
          <p className="font-body text-xs text-[#ECE8E1]/50 leading-relaxed">
            {mode.description}
          </p>
        </div>
      </div>

      {!mode.available && (
        <div className="absolute bottom-3 right-3 font-display text-[10px] uppercase tracking-widest text-[#FF4655]/60 font-bold">
          PRÓXIMAMENTE
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-1">
        {label}
      </div>
      <div className="font-display font-black text-2xl text-[#ECE8E1]">{value}</div>
    </div>
  );
}
