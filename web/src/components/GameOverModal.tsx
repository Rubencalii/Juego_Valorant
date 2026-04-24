"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ChainNode {
  playerId: number;
  nickname: string;
  sharedTeam?: string;
}

interface GameOverModalProps {
  isOpen: boolean;
  result: "win" | "lose" | "timeout";
  chain: ChainNode[];
  chainLength: number;
  durationSecs: number;
  onPlayAgain: () => void;
}

export function GameOverModal({
  isOpen,
  result,
  chain,
  chainLength,
  durationSecs,
  onPlayAgain,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const isWin = result === "win";
  const title = isWin ? "CONNECTION ESTABLISHED" : result === "timeout" ? "TIMEOUT // LINK SEVERED" : "CONNECTION LOST";
  const subtitle = isWin
    ? "SYS.OP.SUCCESS // CHAIN VERIFIED"
    : "CRITICAL FAILURE // UPLINK SEVERED";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-lg relative"
      >
        {/* Corner decorations */}
        <div className={`absolute top-0 left-0 w-2 h-2 ${isWin ? "bg-[#02e600]" : "bg-[#FF4655]"}`} />
        <div className={`absolute top-0 right-0 w-2 h-2 ${isWin ? "bg-[#02e600]" : "bg-[#FF4655]"}`} />
        <div className={`absolute bottom-0 left-0 w-2 h-2 ${isWin ? "bg-[#02e600]" : "bg-[#FF4655]"}`} />
        <div className={`absolute bottom-0 right-0 w-2 h-2 ${isWin ? "bg-[#02e600]" : "bg-[#FF4655]"}`} />

        {/* Main content */}
        <div className={`border-2 ${isWin ? "border-[#02e600]" : "border-[#FF4655]"} bg-[#0a141e] p-8`}>
          {/* Header */}
          <div className={`text-center mb-6 ${isWin ? "border-b border-[#02e600]/30" : "border-b border-[#FF4655]/30"} pb-6`}>
            {/* Icon */}
            <motion.div
              animate={isWin ? { scale: [1, 1.1, 1] } : { x: [-2, 2, -2, 2, 0] }}
              transition={{ duration: isWin ? 1.5 : 0.4, repeat: isWin ? Infinity : 2 }}
              className={`text-5xl mb-4 ${isWin ? "text-[#02e600]" : "text-[#FF4655]"}`}
            >
              {isWin ? "✓" : "⚠"}
            </motion.div>

            <h2 className={`font-display font-black text-3xl uppercase tracking-tight ${isWin ? "text-[#02e600]" : "text-[#FF4655]"}`}>
              {title}
            </h2>
            <p className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/40 mt-2">
              {subtitle}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#17202b] border border-[#ECE8E1]/10 p-4 text-center">
              <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-1">
                CHAIN LENGTH
              </div>
              <div className={`font-display font-black text-3xl ${isWin ? "text-[#02e600]" : "text-[#FF4655]"}`}>
                {chainLength}
              </div>
            </div>
            <div className="bg-[#17202b] border border-[#ECE8E1]/10 p-4 text-center">
              <div className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-1">
                DURATION
              </div>
              <div className="font-display font-black text-3xl text-[#ECE8E1]">
                {durationSecs}s
              </div>
            </div>
          </div>

          {/* Chain preview */}
          {chain.length > 0 && (
            <div className="mb-6 max-h-32 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#5b403f #0a141e" }}>
              <div className="text-[10px] font-display uppercase tracking-widest text-[#ECE8E1]/30 mb-2">
                CHAIN_LOG:
              </div>
              <div className="flex flex-wrap gap-1">
                {chain.map((node, i) => (
                  <React.Fragment key={node.playerId}>
                    <span className="font-display text-xs font-bold text-[#ECE8E1] uppercase bg-[#17202b] px-2 py-1">
                      {node.nickname}
                    </span>
                    {i < chain.length - 1 && (
                      <span className="text-[#FF4655] text-xs flex items-center font-mono">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onPlayAgain}
              className={`flex-1 font-display font-black py-3 uppercase tracking-[0.2em] text-sm transition-all relative group overflow-hidden
                ${isWin
                  ? "bg-[#02e600] text-[#013200] hover:bg-[#02e600]/90"
                  : "bg-[#FF4655] text-[#ECE8E1] hover:bg-[#FF4655]/90"
                }`}
            >
              <span className="relative z-10">PLAY AGAIN</span>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
            </button>
            <Link
              href="/"
              className="flex-1 font-display font-black py-3 uppercase tracking-[0.2em] text-sm text-center border border-[#ECE8E1]/20 text-[#ECE8E1] hover:bg-[#ECE8E1]/5 transition-all"
            >
              RETURN TO HUB
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
