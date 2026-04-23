"use client";

import { motion } from "framer-motion";

interface PlayerCardProps {
  nickname: string;
  realName?: string | null;
  countryCode?: string | null;
  teamName?: string;
  isActive?: boolean;
}

export default function PlayerCard({ nickname, realName, countryCode, teamName, isActive }: PlayerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="game-card"
      style={{
        borderColor: isActive ? "var(--accent-red)" : "var(--border-color)",
        boxShadow: isActive ? "0 0 30px var(--accent-red-glow)" : "none",
        textAlign: "center",
        padding: "24px 20px",
      }}
    >
      {/* Player avatar placeholder */}
      <div style={{
        width: 72, height: 72,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent-red), var(--accent-red-dim))",
        margin: "0 auto 12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.5rem", fontWeight: 900, color: "white",
        border: "3px solid var(--bg-primary)",
        boxShadow: isActive ? "0 0 20px var(--accent-red-glow)" : "none",
      }}>
        {nickname.charAt(0).toUpperCase()}
      </div>

      {/* Nickname */}
      <motion.h2
        key={nickname}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          fontSize: "1.4rem",
          fontWeight: 900,
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        {nickname}
      </motion.h2>

      {/* Real name */}
      {realName && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 8 }}>
          {countryCode && <span style={{ marginRight: 4 }}>{getFlagEmoji(countryCode)}</span>}
          {realName}
        </p>
      )}

      {/* Team badge */}
      {teamName && (
        <span className="tag tag-red" style={{ marginTop: 4 }}>
          {teamName}
        </span>
      )}
    </motion.div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
