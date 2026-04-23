"use client";

import React, { useState, useEffect } from 'react';
import { PlayerCard } from '@/components/PlayerCard';
import { Timer } from '@/components/Timer';
import { SearchInput } from '@/components/SearchInput';
import { motion } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';

export default function GamePage() {
  const { data: session, status } = useSession();
  const [timeLeft, setTimeLeft] = useState(15);
  const [isActive, setIsActive] = useState(true);

  // Mock decrement timer
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
  }, [timeLeft, isActive]);

  const handleTurn = (guess: string) => {
    console.log("Jugador intento conectar con:", guess);
    setTimeLeft(15);
  };

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-20 scanline z-50"></div>
      
      {/* Header / Navbar */}
      <header className="relative z-20 flex justify-between items-center w-full max-w-6xl mx-auto py-4 border-b border-[#ece8e1]/10">
        <div className="font-black text-[#ff4655] text-xl tracking-tighter italic uppercase">
          SPIKELINK<span className="text-[#ece8e1]">.GG</span>
        </div>
        
        <div className="flex items-center gap-6">
          {status === "authenticated" ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-black text-[#ff4655] uppercase tracking-widest">AGENTE AUTORIZADO</div>
                <div className="text-sm font-bold uppercase">{session.user?.name}</div>
              </div>
              <button 
                onClick={() => signOut()}
                className="bg-[#ff4655] text-[#ece8e1] px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#ff4655]/80 transition-all"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                href="/login"
                className="text-[#ece8e1] hover:text-[#ff4655] text-xs font-black uppercase tracking-widest transition-all"
              >
                LOGIN
              </Link>
              <Link 
                href="/register"
                className="bg-[#ff4655] text-[#ece8e1] px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#ff4655]/80 transition-all"
              >
                REGÍSTRATE
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="absolute top-24 left-6 font-bold text-[#ff4655] text-[10px] flex items-center gap-2 mix-blend-screen opacity-60 uppercase tracking-[0.3em]">
        <span className="w-2 h-2 bg-[#ff4655] animate-pulse"></span>
        SPIKELINK_OS://V.1.0 // SESSION_ID: {status === "authenticated" ? "AUTHORIZED" : "GUEST"}
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center relative z-10 mt-10">
        <Timer timeLeft={timeLeft} />
        
        <div className="relative w-full flex flex-col md:flex-row items-center justify-center gap-2 md:gap-32 mt-12 mb-8">
          <PlayerCard 
            nickname="Boaster" 
            realName="Jake Howlett" 
            role="IGL" 
            kd="1.0" 
            isOnline={true} 
            imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/FNATIC_logo.svg/2048px-FNATIC_logo.svg.png"
          />

          <div className="md:absolute top-1/2 left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex items-center justify-center -my-8 md:my-0 z-20">
             <motion.div 
               className="w-4 h-4 bg-[#ff4655] rotate-45 border border-[#ece8e1]/20 shadow-[0_0_15px_rgba(255,70,85,0.5)]"
               animate={{ scale: [1, 1.3, 1], rotate: 45 }}
               transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>

          <div className="opacity-50 grayscale scale-95 blur-[1px]">
             <PlayerCard nickname="???" role="Unknown" kd="0.0" isOnline={false} />
          </div>
        </div>

        <SearchInput onSearch={handleTurn} />
      </div>
    </main>
  );
}
