"use client";

import React from "react";
import { motion } from "framer-motion";

interface ChainNode {
  playerId: number;
  nickname: string;
  sharedTeam?: string;
}

interface ChainHistoryProps {
  chain: ChainNode[];
}

export function ChainHistory({ chain }: ChainHistoryProps) {
  if (chain.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto border-t border-[#ECE8E1]/10 pt-6 mt-8">
      <h4 className="font-display font-bold text-xs text-[#ECE8E1]/50 mb-4 tracking-[0.2em] uppercase">
        CONNECTION CHAIN // {chain.length} NODE{chain.length !== 1 ? "S" : ""}
      </h4>

      <div
        className="space-y-1 max-h-48 overflow-y-auto pr-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#5b403f #0a141e" }}
      >
        {chain.map((node, index) => (
          <motion.div
            key={`${node.playerId}-${index}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#17202b] hover:bg-[#212b35] border-l-2 border-[#2c3641] hover:border-[#FF4655] transition-colors p-3 flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              {/* Node index */}
              <span className="font-mono text-[10px] text-[#FF4655] font-bold w-6 text-center">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Connection line indicator */}
              {index > 0 && node.sharedTeam && (
                <span className="text-[10px] text-[#02e600] font-display font-bold uppercase tracking-widest bg-[#02e600]/10 px-2 py-0.5">
                  {node.sharedTeam}
                </span>
              )}

              {/* Player nickname */}
              <span className="font-display font-bold text-sm text-[#ECE8E1] uppercase tracking-tight group-hover:text-[#FF4655] transition-colors">
                {node.nickname}
              </span>
            </div>

            {/* Decorative */}
            <span className="text-[10px] text-[#ECE8E1]/20 font-mono">
              NODE_{node.playerId}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
