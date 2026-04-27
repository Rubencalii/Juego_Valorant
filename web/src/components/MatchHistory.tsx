import React from "react";
import { motion } from "framer-motion";

interface Match {
  id: string;
  mode: string;
  result: "WIN" | "LOSS" | "DRAW";
  chain_length: number;
  created_at: string;
}

interface MatchHistoryProps {
  matches: Match[];
}

export default function MatchHistory({ matches }: MatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 border border-[#ECE8E1]/5 bg-[#17202b]/50">
        <p className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/20">
          Sin registros de combate recientes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match, index) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 p-3 border border-[#ECE8E1]/10 bg-[#17202b] hover:border-[#ECE8E1]/30 transition-all group"
        >
          {/* Result Indicator */}
          <div 
            className={`w-1 h-8 ${
              match.result === "WIN" ? "bg-[#02e600]" : "bg-[#FF4655]"
            }`}
          />

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className={`font-display font-black text-xs uppercase tracking-widest ${
                match.result === "WIN" ? "text-[#02e600]" : "text-[#FF4655]"
              }`}>
                {match.result}
              </span>
              <span className="font-mono text-[10px] text-[#ECE8E1]/30">
                {new Date(match.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/60">
                MODO: {match.mode.toUpperCase()}
              </span>
              <span className="font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/60">
                CHAIN: <span className="text-[#ECE8E1]">{match.chain_length}</span>
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
