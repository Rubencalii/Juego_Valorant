"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchInput } from "@/components/SearchInput";
import { ChainHistory } from "@/components/ChainHistory";
import { ConnectionToast, createToast } from "@/components/ConnectionToast";
import { useSession } from "next-auth/react";

export default function SurvivalPage() {
  const { data: session } = useSession();
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [chain, setChain] = useState<any[]>([]);
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    startSurvival();
  }, []);

  const startSurvival = async () => {
    setLoading(true);
    setGameOver(false);
    setChain([]);
    setUsedIds([]);
    try {
      const res = await fetch("/api/match/start", { method: "POST", body: JSON.stringify({ mode: "bot" }) });
      const data = await res.json();
      setCurrentPlayer(data.startPlayer);
      setUsedIds([data.startPlayer.id]);
      setChain([{ playerId: data.startPlayer.id, nickname: data.startPlayer.nickname }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (nickname: string) => {
    if (gameOver || isVerifying) return;
    setIsVerifying(true);

    try {
      const res = await fetch("/api/match/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlayerId: currentPlayer.id,
          guessedPlayerName: nickname,
          usedPlayerIds: usedIds,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        const nextPlayer = data.newPlayerData;
        setToast(createToast("success", `CONECTADO VIA ${data.sharedTeam}`, `${nextPlayer.nickname}`));
        setCurrentPlayer(nextPlayer);
        setUsedIds(prev => [...prev, nextPlayer.id]);
        setChain(prev => [...prev, { playerId: nextPlayer.id, nickname: nextPlayer.nickname, sharedTeam: data.sharedTeam }]);
      } else {
        setGameOver(true);
        saveScore(chain.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const saveScore = async (length: number) => {
    if (!session?.user) return;
    await fetch("/api/match/save", {
      method: "POST",
      body: JSON.stringify({
        mode: "survival",
        chainLength: length,
        result: "lose", // In survival, you always eventually "lose" or stop
        durationSecs: 0,
        chainNodes: usedIds
      })
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col relative overflow-hidden font-body pt-24 pb-20">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      <ConnectionToast toast={toast} onDismiss={() => setToast(null)} />

      <div className="w-full max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="text-[10px] font-display font-bold text-[#02e600] uppercase tracking-[0.5em] mb-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-[#02e600] animate-pulse" />
            MODO SUPERVIVENCIA // CADENA: {chain.length}
          </div>
          <h1 className="font-display font-black text-5xl uppercase tracking-tighter italic">TEAMMATE<span className="text-[#FF4655]">CHAIN</span></h1>
        </div>

        <AnimatePresence mode="wait">
          {!gameOver ? (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-8 border-2 border-[#FF4655] p-2 bg-[#17202b] shadow-[0_0_40px_rgba(255,70,85,0.2)]">
                <div className="relative w-48 h-64 bg-black overflow-hidden flex items-center justify-center">
                  {currentPlayer?.image_url ? (
                    <img src={currentPlayer.image_url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="" />
                  ) : (
                    <span className="text-4xl font-display opacity-20">VAL</span>
                  )}
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                    <div className="font-display font-black text-xl uppercase italic leading-none">{currentPlayer?.nickname}</div>
                    <div className="text-[8px] font-display uppercase tracking-widest text-[#FF4655] mt-1">JUGADOR ACTUAL</div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md">
                <SearchInput onSearch={handleGuess} isLoading={isVerifying} placeholder="¿CON QUIÉN HA JUGADO?" />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-[#FF4655]/10 border border-[#FF4655]/30 p-12 w-full max-w-2xl"
            >
              <div className="font-display font-black text-7xl text-[#FF4655] italic mb-4">CADENA ROTA</div>
              <p className="font-display text-xl uppercase mb-8">LOGRASTE UNA CADENA DE {chain.length} AGENTES</p>
              <button 
                onClick={startSurvival}
                className="bg-[#FF4655] text-white font-display font-black px-12 py-4 uppercase tracking-widest hover:bg-[#FF4655]/80 transition-all"
              >
                INTENTAR DE NUEVO
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 w-full">
          <ChainHistory chain={chain} />
        </div>
      </div>
    </main>
  );
}
