"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardUser {
  id: string;
  nickname: string;
  elo: number;
  gamesPlayed: number;
  bestChain: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/leaderboard")
        .then((res) => res.json())
        .then((data) => {
          if (data.leaderboard) setLeaderboard(data.leaderboard);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(10, 20, 30, 0.8)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            className="game-card"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: "90%",
              maxWidth: 500,
              maxHeight: "80vh",
              zIndex: 101,
              padding: "32px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              overflowY: "auto"
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <h2 style={{
                fontSize: "1.8rem", fontWeight: 900, fontStyle: "italic",
                color: "var(--accent-cyan)", letterSpacing: "-0.02em",
              }}>
                🏆 TOP PLAYERS
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>
                Los mejores jugadores de SpikeLink en todo el mundo.
              </p>
            </div>

            {/* List */}
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                CARGANDO DATOS...
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Table Header */}
                <div style={{ 
                  display: "flex", alignItems: "center", padding: "0 12px", 
                  color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "var(--font-mono)", 
                  textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 8,
                  borderBottom: "1px solid var(--border-color)"
                }}>
                  <div style={{ width: 30, textAlign: "center" }}>#</div>
                  <div style={{ flex: 1, paddingLeft: 12 }}>Nickname</div>
                  <div style={{ width: 60, textAlign: "right" }}>ELO</div>
                  <div style={{ width: 60, textAlign: "right" }}>Cadena</div>
                </div>

                {/* Rows */}
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.id}
                    style={{
                      display: "flex", alignItems: "center", padding: "12px",
                      background: index < 3 ? "rgba(65, 217, 255, 0.05)" : "transparent",
                      border: index < 3 ? "1px solid rgba(65, 217, 255, 0.2)" : "1px solid transparent",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ 
                      width: 30, textAlign: "center", fontWeight: 900, fontFamily: "var(--font-mono)",
                      color: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "var(--text-muted)"
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, paddingLeft: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                      {user.nickname}
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                      {user.elo}
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      {user.bestChain}
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                    Aún no hay jugadores en el ranking.
                  </div>
                )}
              </div>
            )}
            
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none", color: "var(--text-muted)",
                cursor: "pointer", fontSize: "1.2rem", padding: 4,
              }}
            >
              ✕
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
