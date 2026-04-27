"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface RankedUser {
  rank: number;
  id: string;
  nickname: string;
  elo: number;
  total_matches: number;
  wins: number;
  best_chain: number;
}

type Scope = "global" | "weekly";

export default function RankingPage() {
  const [scope, setScope] = useState<Scope>("global");
  const [sortBy, setSortBy] = useState<"elo" | "points">("elo");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchRanking = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking?scope=${scope}&page=${page}&limit=20&sort=${sortBy}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [scope, page, sortBy]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] relative overflow-hidden font-body">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      <div className="absolute inset-0 pointer-events-none diagonal-bg" />

      <div className="w-full max-w-4xl mx-auto px-4 pt-28 pb-32 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display font-black text-4xl uppercase tracking-tight italic mb-2">
            RANKING <span className="text-[#FF4655]">GLOBAL</span>
          </h1>
          <p className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/40">
            SPIKELINK_OS://STATIONS/LEADERBOARD
          </p>
        </motion.div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {(["global", "weekly"] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => { setScope(s); setPage(1); }}
                className={`font-display font-bold text-xs uppercase tracking-[0.2em] px-4 py-2 transition-all border
                  ${scope === s
                    ? "bg-[#FF4655] text-[#ECE8E1] border-[#FF4655]"
                    : "text-[#ECE8E1]/50 border-[#ECE8E1]/10 hover:border-[#FF4655]/50"
                  }`}
              >
                {s === "global" ? "GLOBAL" : "SEMANAL"}
              </button>
            ))}
          </div>

          <div className="flex gap-2 bg-[#17202b] p-1 border border-[#ECE8E1]/10">
            {(["elo", "points"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`font-display font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 transition-all
                  ${sortBy === s
                    ? "bg-[#ECE8E1] text-[#0f1923]"
                    : "text-[#ECE8E1]/40 hover:text-[#ECE8E1]/70"
                  }`}
              >
                ORDENAR POR {s === "elo" ? "ELO" : "PUNTOS"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#ECE8E1]/10 bg-[#17202b] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_80px_80px_80px_80px_80px] gap-2 px-4 py-3 border-b border-[#ECE8E1]/10 text-[10px] font-display font-bold uppercase tracking-widest text-[#ECE8E1]/40">
            <span>#</span>
            <span>AGENTE</span>
            <span className="text-right">PUNTOS</span>
            <span className="text-right">ELO</span>
            <span className="text-right">WINS</span>
            <span className="text-right hidden sm:block">MATCHES</span>
            <span className="text-right hidden sm:block">BEST</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-4 py-12 text-center">
              <div className="w-6 h-6 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/30">LOADING_DATA...</div>
            </div>
          )}

          {/* Empty */}
          {!loading && users.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/30">
                NO_DATA_FOUND // Aún no hay agentes registrados
              </div>
            </div>
          )}

          {/* Rows */}
          {!loading && users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`grid grid-cols-[60px_1fr_80px_80px_80px_80px_80px] gap-2 px-4 py-3 items-center border-l-2 transition-colors
                ${user.rank <= 3
                  ? "border-[#FF4655] bg-[#FF4655]/5"
                  : "border-transparent hover:border-[#FF4655] hover:bg-[#212b35]"
                }
                ${index < users.length - 1 ? "border-b border-b-[#ECE8E1]/5" : ""}`}
            >
              <span className={`font-display font-black text-lg ${user.rank <= 3 ? "text-[#FF4655]" : "text-[#ECE8E1]/40"}`}>
                {String(user.rank).padStart(2, "0")}
              </span>
              <span className="font-display font-bold text-sm uppercase tracking-tight truncate">
                {user.nickname}
              </span>
              <span className="text-right font-mono text-sm text-[#FFD700] font-bold">
                {user.total_points || 0}
              </span>
              <span className="text-right font-mono text-sm text-[#02e600] font-bold">
                {user.elo}
              </span>
              <span className="text-right font-mono text-sm text-[#ECE8E1]/70">
                {user.wins}
              </span>
              <span className="text-right font-mono text-sm text-[#ECE8E1]/40 hidden sm:block">
                {user.total_matches}
              </span>
              <span className="text-right font-mono text-sm text-[#FFB3B2] hidden sm:block">
                {user.best_chain}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="font-display font-bold text-xs uppercase tracking-widest text-[#ECE8E1]/40 hover:text-[#FF4655] disabled:opacity-30 transition-colors px-3 py-1 border border-[#ECE8E1]/10"
            >
              ← PREV
            </button>
            <span className="font-mono text-xs text-[#ECE8E1]/30 flex items-center">
              PAGE {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < 20}
              className="font-display font-bold text-xs uppercase tracking-widest text-[#ECE8E1]/40 hover:text-[#FF4655] disabled:opacity-30 transition-colors px-3 py-1 border border-[#ECE8E1]/10"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
