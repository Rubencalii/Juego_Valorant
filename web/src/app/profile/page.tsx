"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface UserStats {
  elo: number;
  total_matches: number;
  wins: number;
  best_chain: number;
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
  }, [status]);

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

      <div className="w-full max-w-3xl mx-auto px-4 pt-28 pb-32 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-[10px] font-display font-bold text-[#FF4655] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#02e600]" />
            AGENT PROFILE // STATUS: ONLINE
          </div>

          <h1 className="font-display font-black text-5xl uppercase tracking-tight italic mb-2">
            {session?.user?.name || "AGENT"}
          </h1>
          <p className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/40">
            {session?.user?.email || "NO_EMAIL_LINKED"}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <StatCard label="ELO RATING" value={String(stats?.elo || 1000)} color="#02e600" />
          <StatCard label="TOTAL WINS" value={String(stats?.wins || 0)} color="#FF4655" />
          <StatCard label="BEST CHAIN" value={String(stats?.best_chain || 0)} color="#FFB3B2" />
          <StatCard label="MATCHES" value={String(stats?.total_matches || 0)} color="#ECE8E1" />
        </motion.div>

        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-[#ECE8E1]/10 bg-[#17202b] p-6 mb-8"
        >
          <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-4">
            PERFORMANCE METRICS
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/60">WIN RATE</span>
                <span className="font-mono text-xs text-[#02e600]">
                  {stats && stats.total_matches > 0
                    ? `${Math.round((stats.wins / stats.total_matches) * 100)}%`
                    : "—"
                  }
                </span>
              </div>
              <div className="w-full h-2 bg-[#0a141e] border border-[#ECE8E1]/10">
                <div
                  className="h-full bg-[#02e600] transition-all duration-500"
                  style={{
                    width: stats && stats.total_matches > 0
                      ? `${(stats.wins / stats.total_matches) * 100}%`
                      : "0%"
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Link
            href="/play?mode=bot"
            className="flex-1 text-center font-display font-black text-sm uppercase tracking-[0.2em] bg-[#FF4655] text-[#ECE8E1] py-4 hover:bg-[#FF4655]/90 transition-all"
          >
            PLAY NOW
          </Link>
          <Link
            href="/ranking"
            className="flex-1 text-center font-display font-black text-sm uppercase tracking-[0.2em] border border-[#ECE8E1]/20 text-[#ECE8E1] py-4 hover:bg-[#ECE8E1]/5 transition-all"
          >
            VIEW RANKING
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-[#ECE8E1]/10 bg-[#17202b] p-4 text-center">
      <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-2">
        {label}
      </div>
      <div className="font-display font-black text-3xl" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
