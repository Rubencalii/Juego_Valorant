"use client";
// v1.0.1 - Deploy Fix

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { GlobalChat } from "@/components/GlobalChat";

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
  {
    id: "guess",
    title: "ADIVINA AL AGENTE",
    subtitle: "CLASSIC MODE",
    description: "Adivina el jugador oculto del día basándote en sus atributos (Equipo, Región, País).",
    icon: "🕵️",
    href: "/play/guess",
    color: "#FFB3B2",
    available: true,
  },
  {
    id: "grid",
    title: "LA CUADRÍCULA",
    subtitle: "IMMACULATE GRID",
    description: "9 celdas, 9 desafíos. Rellena la cuadrícula con jugadores que cumplan ambas condiciones.",
    icon: "🧱",
    href: "/play/grid",
    color: "#4da6c5",
    available: true,
  },
  {
    id: "higher_lower",
    title: "¿MÁS O MENOS?",
    subtitle: "HIGHER OR LOWER",
    description: "¿Quién tiene más experiencia? Adivina si el siguiente jugador tiene más o menos mapas jugados.",
    icon: "📈",
    href: "/play/higher-lower",
    color: "#02e600",
    available: true,
  },
  {
    id: "survival",
    title: "CADENA COMPAÑEROS",
    subtitle: "SURVIVAL MODE",
    description: "¿Cuántos compañeros puedes encadenar sin repetir ni fallar? Pon a prueba tu memoria.",
    icon: "🔗",
    href: "/play/survival",
    color: "#FF4655",
    available: true,
  },
];

export default function HubPage() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col relative overflow-hidden font-body">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />

      {/* Tech Overlays */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FF4655]/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0f1923] to-transparent pointer-events-none" />
      
      {/* Animated geometric elements */}
      <motion.div 
        animate={{ 
          rotate: 360,
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-24 -right-24 w-96 h-96 border border-[#FF4655]/20 rounded-full pointer-events-none"
      />

      <div className="w-full max-w-5xl mx-auto px-4 pt-28 pb-32 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="text-[10px] font-display font-bold text-[#FF4655] uppercase tracking-[0.5em] mb-4 flex items-center justify-center gap-3">
            <span className="inline-block w-8 h-[1px] bg-[#FF4655]/30" />
            <span className="relative">
              <span className="absolute -inset-1 blur-sm bg-[#FF4655]/20 animate-pulse" />
              SPIKELINK_OS://V.1.0
            </span>
            <span className="inline-block w-8 h-[1px] bg-[#FF4655]/30" />
          </div>

          <h1 className="font-display font-black text-6xl md:text-8xl uppercase tracking-tighter italic mb-4 relative group">
            <span className="relative z-10">SPIKE<span className="text-[#FF4655]">LINK</span></span>
            <motion.span 
              animate={{ x: [-2, 2, -2], opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.2, repeat: Infinity }}
              className="absolute inset-0 text-[#02e600] z-0 translate-x-1 opacity-50 hidden group-hover:block"
            >
              SPIKELINK
            </motion.span>
          </h1>

          <p className="font-body text-[#ECE8E1]/50 text-sm md:text-base max-w-xl mx-auto border-l border-[#FF4655]/50 pl-4 text-left md:text-center md:border-l-0 md:pl-0">
            EL PROTOCOLO DE CONEXIÓN DE AGENTES HA SIDO INICIADO. 
            <br />
            <span className="text-[10px] opacity-50 tracking-widest mt-2 block italic">
              CONECTA JUGADORES PROFESIONALES // EVITA EL ERROR DE SISTEMA
            </span>
          </p>
        </motion.div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {GAME_MODES.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
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

        {/* Global Chat Section */}
        <div className="mt-12">
          <GlobalChat />
        </div>
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
