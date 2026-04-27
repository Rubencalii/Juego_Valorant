"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

import RankIcon from "@/components/RankIcon";
import MatchHistory from "@/components/MatchHistory";

interface Match {
  id: string;
  mode: string;
  result: "WIN" | "LOSS" | "DRAW";
  chain_length: number;
  created_at: string;
}

interface UserStats {
  elo: number;
  total_points: number;
  total_matches: number;
  wins: number;
  best_chain: number;
  rank_name: string;
  title: string;
  banner_color: string;
  last_matches: Match[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/profile/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Stats not available
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] relative overflow-hidden font-body">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      <div className="absolute inset-0 pointer-events-none diagonal-bg" />

      <div className="w-full max-w-4xl mx-auto px-4 pt-28 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar / Rank */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-[#ECE8E1]/10 bg-[#17202b] p-8 text-center relative overflow-hidden group"
            >
              <div 
                className="absolute top-0 left-0 w-full h-1 transition-colors duration-500" 
                style={{ backgroundColor: stats?.banner_color || "#FF4655" }} 
              />
              
              <div className="flex flex-col items-center gap-6">
                <RankIcon rank={stats?.rank_name || "Hierro"} size="lg" />
                
                <div>
                  <h2 className="font-display font-black text-3xl uppercase tracking-tighter italic mb-1">
                    {session?.user?.name || "AGENT"}
                  </h2>
                  <p 
                    className="font-display text-[10px] uppercase tracking-[0.3em] font-bold"
                    style={{ color: stats?.banner_color || "#FF4655" }}
                  >
                    {stats?.title || "AGENTE NOVATO"} // {stats?.rank_name.toUpperCase()}
                  </p>
                </div>

                <div className="w-full h-px bg-[#ECE8E1]/10" />

                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-display uppercase tracking-widest text-[#ECE8E1]/40">
                    <span>ELO RATING</span>
                    <span className="text-[#ECE8E1]">{stats?.elo}</span>
                  </div>
                  <div className="w-full h-1 bg-[#0a141e]">
                    <div 
                      className="h-full bg-[#FF4655]" 
                      style={{ width: `${(Number(stats?.elo || 0) % 300) / 3}%` }} 
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-2"
            >
              <Link
                href="/play?mode=bot"
                className="w-full text-center font-display font-black text-xs uppercase tracking-[0.2em] bg-[#FF4655] text-[#ECE8E1] py-3 hover:bg-[#FF4655]/90 transition-all"
              >
                PLAY NOW
              </Link>
              <Link
                href="/ranking"
                className="w-full text-center font-display font-black text-xs uppercase tracking-[0.2em] border border-[#ECE8E1]/10 text-[#ECE8E1] py-3 hover:bg-[#ECE8E1]/5 transition-all"
              >
                VIEW RANKING
              </Link>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <StatCard label="WINS" value={String(stats?.wins || 0)} />
              <StatCard label="BEST CHAIN" value={String(stats?.best_chain || 0)} />
              <StatCard label="MATCHES" value={String(stats?.total_matches || 0)} />
              <StatCard label="TOTAL POINTS" value={String(stats?.total_points || 0)} />
            </motion.div>

            {/* Win Rate Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-[#ECE8E1]/10 bg-[#17202b] p-6"
            >
              <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-4">
                COMBAT PERFORMANCE
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="font-display font-black text-4xl leading-none">
                  {stats && stats.total_matches > 0
                    ? Math.round((stats.wins / stats.total_matches) * 100)
                    : 0
                  }%
                </span>
                <span className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 pb-1">
                  WIN RATE
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0a141e]">
                <div
                  className="h-full bg-[#02e600] transition-all duration-1000"
                  style={{
                    width: stats && stats.total_matches > 0
                      ? `${(stats.wins / stats.total_matches) * 100}%`
                      : "0%"
                  }}
                />
              </div>
            </motion.div>

            {/* Title Shop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-4"
            >
              <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF4655]" />
                TIENDA DE TÍTULOS (USA TUS PUNTOS)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: "RECLUTA", cost: 0 },
                  { name: "DOMINADOR", cost: 500 },
                  { name: "ESTRATEGA", cost: 1000 },
                  { name: "INMORTAL", cost: 2500 },
                  { name: "RADIANTE", cost: 5000 },
                  { name: "LEYENDA", cost: 10000 },
                ].map((item) => (
                  <button
                    key={item.name}
                    disabled={(stats?.total_points || 0) < item.cost || stats?.title === item.name}
                    onClick={async () => {
                      const res = await fetch("/api/profile/customize", {
                        method: "POST",
                        body: JSON.stringify({ title: item.name, cost: item.cost }),
                      });
                      if (res.ok) window.location.reload();
                    }}
                    className={`p-3 border border-[#ECE8E1]/10 transition-all text-left flex flex-col gap-1 relative overflow-hidden
                      ${stats?.title === item.name ? "bg-[#02e600]/10 border-[#02e600]/30" : "hover:border-[#FF4655]/30"}
                      ${(stats?.total_points || 0) < item.cost && stats?.title !== item.name ? "opacity-40 grayscale" : "cursor-pointer"}
                    `}
                  >
                    <span className="font-display font-black text-xs tracking-widest uppercase">
                      {item.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#ECE8E1]/40">
                      COSTO: {item.cost} PTS
                    </span>
                    {stats?.title === item.name && (
                      <span className="absolute top-2 right-2 text-[10px] text-[#02e600] font-bold">EQUIPADO</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Match History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF4655]" />
                HISTORIAL DE COMBATE RECIENTE
              </div>
              <MatchHistory matches={stats?.last_matches || []} />
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#ECE8E1]/10 bg-[#17202b] p-4">
      <div className="font-display text-[8px] uppercase tracking-widest text-[#ECE8E1]/40 mb-1">
        {label}
      </div>
      <div className="font-display font-black text-2xl text-[#ECE8E1]">
        {value}
      </div>
    </div>
  );
}
