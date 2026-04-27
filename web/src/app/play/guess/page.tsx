"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchInput } from "@/components/SearchInput";
import { useSession } from "next-auth/react";

interface GuessResult {
  id: number;
  nickname: string;
  team: { name: string; status: "correct" | "wrong" | "partial" };
  region: { name: string; status: "correct" | "wrong" };
  country: { name: string; status: "correct" | "wrong" };
  role: { name: string; status: "correct" | "wrong" };
  image_url: string | null;
}

export default function GuessPage() {
  const { data: session } = useSession();
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDaily();
  }, []);

  const fetchDaily = async () => {
    try {
      const res = await fetch("/api/guess/daily");
      const data = await res.json();
      setTargetPlayer(data.player);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (nickname: string) => {
    if (gameOver) return;

    try {
      const res = await fetch("/api/guess/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();

      if (data.result) {
        setGuesses((prev) => [data.result, ...prev]);
        if (data.result.nickname.toLowerCase() === targetPlayer.nickname.toLowerCase()) {
          setGameOver(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col relative overflow-hidden font-body pt-24 pb-20">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      
      <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-5xl uppercase tracking-tighter italic mb-2">
            AGENT<span className="text-[#FF4655]">GUESSER</span>
          </h1>
          <p className="font-display text-[10px] uppercase tracking-[0.4em] text-[#ECE8E1]/40">
            ADIVINA AL JUGADOR DEL DÍA // VLR_DATABASE_MATCH
          </p>
        </div>

        {!gameOver ? (
          <div className="max-w-md mx-auto mb-12">
            <SearchInput onSearch={handleGuess} isLoading={false} placeholder="ESCRIBE EL NOMBRE DEL JUGADOR..." />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#02e600]/10 border border-[#02e600]/30 p-8 text-center mb-12"
          >
            <div className="text-[10px] font-display font-bold text-[#02e600] uppercase tracking-[0.3em] mb-2">MISIÓN COMPLETADA</div>
            <h2 className="font-display font-black text-4xl uppercase mb-4">¡ACERTASTE! ERA {targetPlayer?.nickname}</h2>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#02e600] text-black font-display font-black px-8 py-3 uppercase tracking-widest hover:bg-[#02e600]/80 transition-all"
            >
              VOLVER A JUGAR
            </button>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {guesses.map((guess, idx) => (
              <motion.div
                key={guess.id + "-" + idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-5 gap-2"
              >
                <GuessSquare label="JUGADOR" value={guess.nickname} status="correct" image={guess.image_url} />
                <GuessSquare label="EQUIPO" value={guess.team.name} status={guess.team.status} />
                <GuessSquare label="REGIÓN" value={guess.region.name} status={guess.region.status} />
                <GuessSquare label="PAÍS" value={guess.country.name} status={guess.country.status} />
                <GuessSquare label="ROL" value={guess.role.name} status={guess.role.status} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function GuessSquare({ label, value, status, image }: { label: string; value: string; status: "correct" | "wrong" | "partial"; image?: string | null }) {
  const bgMap = {
    correct: "bg-[#02e600]",
    partial: "bg-[#e7b75c]",
    wrong: "bg-[#FF4655]",
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[8px] font-display uppercase tracking-widest text-[#ECE8E1]/30 text-center">{label}</div>
      <div className={`aspect-square flex flex-col items-center justify-center p-2 text-center relative overflow-hidden transition-all border border-white/10 ${bgMap[status]}`}>
        {image && (
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
        )}
        <span className="relative z-10 font-display font-black text-[10px] md:text-xs uppercase leading-tight drop-shadow-md text-black">
          {value}
        </span>
      </div>
    </div>
  );
}
