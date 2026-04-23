"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ChainNode {
  playerId: number;
  nickname: string;
  teamName?: string;
}

interface ChainHistoryProps {
  chain: ChainNode[];
}

export default function ChainHistory({ chain }: ChainHistoryProps) {
  if (chain.length === 0) return null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 0,
      width: "100%", maxHeight: 220, overflowY: "auto",
      padding: "8px 0",
    }}>
      <AnimatePresence>
        {chain.map((node, i) => (
          <motion.div
            key={`${node.playerId}-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}
          >
            {/* Line connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: i === chain.length - 1 ? "var(--accent-red)" : "var(--accent-green)",
                boxShadow: i === chain.length - 1
                  ? "0 0 10px var(--accent-red-glow)"
                  : "0 0 6px var(--accent-green-glow)",
                flexShrink: 0,
              }} />
              {i < chain.length - 1 && (
                <div style={{
                  width: 2, height: 24,
                  background: "linear-gradient(180deg, var(--accent-green), var(--border-color))",
                  marginTop: 2,
                }} />
              )}
            </div>

            {/* Player info */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                color: "var(--text-muted)", width: 20, textAlign: "right",
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{
                fontWeight: 700, fontSize: "0.85rem",
                color: i === chain.length - 1 ? "var(--text-primary)" : "var(--text-secondary)",
              }}>
                {node.nickname}
              </span>
              {node.teamName && i > 0 && (
                <span className="tag tag-green" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                  {node.teamName}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
