"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerCard } from "@/components/PlayerCard";
import { useSession } from "next-auth/react";

interface PlayerWithStats {
  id: number;
  nickname: string;
  image_url: string | null;
  value: number; // The stat we are comparing (e.g. maps_played)
}

export default function HigherLowerPage() {
  const [playerA, setPlayerA] = useState<PlayerWithStats | null>(null);
  const [playerB, setPlayerB] = useState<PlayerWithStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchInitialPlayers();
  }, []);

  const fetchInitialPlayers = async () => {
    const res = await fetch("/api/match/higher-lower");
    const data = await res.json();
    setPlayerA(data.playerA);
    setPlayerB(data.playerB);
    setGameOver(false);
    setShowResult(false);
  };

  const handleGuess = (guess: "higher" | "lower") => {
    if (!playerA || !playerB || showResult) return;

    const isCorrect = guess === "higher" 
      ? playerB.value >= playerA.value 
      : playerB.value <= playerA.value;

    setShowResult(true);

    setTimeout(() => {
      if (isCorrect) {
        setStreak(prev => prev + 1);
        nextRound(playerB);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const nextRound = async (newPlayerA: PlayerWithStats) => {
    const res = await fetch("/api/match/higher-lower?exclude=" + newPlayerA.id);
    const data = await res.json();
    setPlayerA(newPlayerA);
    setPlayerB(data.playerB);
    setShowResult(false);
  };

  if (!playerA || !playerB) return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline" />
      
      <div className="relative z-10 w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="text-[10px] font-display font-bold text-[#FF4655] uppercase tracking-[0.5em] mb-2">STREAK: {streak}</div>
          <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter italic">¿MÁS O <span className="text-[#FF4655]">MENOS</span>?</h1>
          <p className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mt-2">¿QUIÉN HA JUGADO MÁS MAPAS OFICIALES EN VLR?</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Player A (The reference) */}
          <div className="relative group">
            <PlayerCard 
              nickname={playerA.nickname}
              imageUrl={playerA.image_url || undefined}
              role="JUGADOR"
              kd="MAPS"
              isOnline={true}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FF4655] px-6 py-2 font-display font-black text-2xl shadow-xl">
              {playerA.value}
            </div>
          </div>

          <div className="text-4xl font-display font-black italic text-[#FF4655] animate-pulse">VS</div>

          {/* Player B (The guess) */}
          <div className="relative group">
            <PlayerCard 
              nickname={playerB.nickname}
              imageUrl={playerB.image_url || undefined}
              role="JUGADOR"
              kd="???"
              isOnline={false}
            />
            
            <AnimatePresence>
              {!showResult && !gameOver ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6"
                >
                  <button 
                    onClick={() => handleGuess("higher")}
                    className="w-full bg-[#02e600] text-black font-display font-black py-4 uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    MÁS ▲
                  </button>
                  <button 
                    onClick={() => handleGuess("lower")}
                    className="w-full border-2 border-[#FF4655] text-[#FF4655] font-display font-black py-4 uppercase tracking-widest hover:bg-[#FF4655]/10 transition-all"
                  >
                    MENOS ▼
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 font-display font-black text-2xl shadow-xl
                    ${gameOver ? "bg-[#FF4655]" : "bg-[#02e600] text-black"}
                  `}
                >
                  {playerB.value}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="text-[#FF4655] text-8xl mb-4 font-display font-black italic tracking-tighter">GAME OVER</div>
            <div className="text-white text-2xl font-display font-black uppercase mb-8">RACHA FINAL: {streak}</div>
            <button 
              onClick={fetchInitialPlayers}
              className="bg-[#FF4655] text-white font-display font-black px-12 py-4 uppercase tracking-[0.3em] hover:bg-[#FF4655]/80 transition-all shadow-[0_0_30px_rgba(255,70,85,0.4)]"
            >
              REINTENTAR ACCESO
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
