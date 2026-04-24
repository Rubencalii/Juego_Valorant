"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchmakingPage() {
  const { data: session, status } = useSession();
  const socket = useSocket();
  const router = useRouter();

  const [isSearching, setIsSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [elo, setElo] = useState(1000);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      fetchElo();
    }
  }, [status, router]);

  const fetchElo = async () => {
    try {
      const res = await fetch("/api/profile/stats");
      const data = await res.json();
      if (data.elo) setElo(data.elo);
    } catch {}
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("match_found", ({ roomId, opponent, startId, targetId }) => {
      router.push(`/play?mode=pvp&roomId=${roomId}&bet=20&startId=${startId}&targetId=${targetId}`);
    });

    return () => {
      socket.off("match_found");
    };
  }, [socket, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleStartSearch = () => {
    if (!socket || !session?.user) return;
    setIsSearching(true);
    socket.emit("join_queue", { 
      userId: (session.user as any).id, 
      nickname: session.user.name, 
      elo 
    });
  };

  const handleCancel = () => {
    if (!socket || !session?.user) return;
    setIsSearching(false);
    setSeconds(0);
    socket.emit("leave_queue", { userId: (session.user as any).id });
  };

  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      
      {/* Background decoration */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] border border-[#FF4655]/10 rounded-full flex items-center justify-center pointer-events-none"
      >
        <div className="w-[600px] h-[600px] border border-[#FF4655]/5 rounded-full" />
      </motion.div>

      <div className="w-full max-w-lg relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-[10px] font-display font-black text-[#FF4655] uppercase tracking-[0.4em] mb-4">
            COMPETITIVE MATCHMAKING // V.1.0
          </div>
          <h1 className="font-display font-black text-6xl uppercase tracking-tighter italic mb-2">
            RANKED <span className="text-[#ECE8E1]">PLAY</span>
          </h1>
          <div className="font-mono text-sm text-[#ECE8E1]/40 mb-12">
            ELO ACTUAL: <span className="text-[#02e600] font-bold">{elo}</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSearching ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <button
                onClick={handleStartSearch}
                className="group relative w-64 h-64 mx-auto flex flex-col items-center justify-center border-2 border-[#FF4655] bg-[#FF4655]/5 hover:bg-[#FF4655]/10 transition-all duration-300"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
                <div className="font-display font-black text-xl uppercase tracking-widest">BUSCAR</div>
                <div className="absolute inset-0 border border-[#FF4655] translate-x-2 translate-y-2 pointer-events-none opacity-50" />
              </button>
              <p className="text-xs text-[#ECE8E1]/30 uppercase tracking-widest max-w-xs mx-auto">
                Se te emparejará con un agente de nivel similar. Victoria: +20 ELO.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-12"
            >
              <div className="relative w-48 h-48 mx-auto">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-t-[#FF4655] border-r-transparent border-b-transparent border-l-transparent rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-4xl font-black text-[#FF4655]">
                  {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-display text-sm uppercase tracking-widest animate-pulse text-[#ECE8E1]">
                  BUSCANDO OPONENTE...
                </div>
                <button
                  onClick={handleCancel}
                  className="font-display font-bold text-xs uppercase tracking-widest text-[#FF4655]/60 hover:text-[#FF4655] transition-colors border border-[#FF4655]/20 px-6 py-2"
                >
                  CANCELAR BÚSQUEDA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
