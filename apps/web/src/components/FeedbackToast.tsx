"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FeedbackToastProps {
  type: "success" | "error" | "info" | null;
  message: string;
  teamName?: string;
}

export default function FeedbackToast({ type, message, teamName }: FeedbackToastProps) {
  if (!type) return null;

  const colors = {
    success: { bg: "rgba(2, 230, 0, 0.1)", border: "var(--accent-green)", text: "var(--accent-green)" },
    error: { bg: "rgba(255, 70, 85, 0.1)", border: "var(--accent-red)", text: "var(--accent-red)" },
    info: { bg: "rgba(65, 217, 255, 0.1)", border: "var(--accent-cyan)", text: "var(--accent-cyan)" },
  };

  const c = colors[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        className={type === "error" ? "glitch-text" : ""}
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: "1.2rem", flexShrink: 0 }}>
          {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: c.text }}>{message}</div>
          {teamName && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Equipo compartido: <strong>{teamName}</strong>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
