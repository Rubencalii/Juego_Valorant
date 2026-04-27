import React from "react";
import { motion } from "framer-motion";

interface AbilitiesProps {
  onUseHint: (type: "reveal" | "wingman") => void;
  abilitiesLeft: {
    reveal: number;
    wingman: number;
  };
  isDisabled: boolean;
}

export function Abilities({ onUseHint, abilitiesLeft, isDisabled }: AbilitiesProps) {
  return (
    <div className="flex gap-4 mt-8">
      {/* Sova Reveal */}
      <AbilityButton
        icon="🏹"
        label="SOVA REVEAL"
        count={abilitiesLeft.reveal}
        onClick={() => onUseHint("reveal")}
        disabled={isDisabled || abilitiesLeft.reveal <= 0}
        color="#4da6c5"
      />

      {/* Gekko Wingman */}
      <AbilityButton
        icon="🦎"
        label="GEKKO WINGMAN"
        count={abilitiesLeft.wingman}
        onClick={() => onUseHint("wingman")}
        disabled={isDisabled || abilitiesLeft.wingman <= 0}
        color="#02e600"
      />
    </div>
  );
}

function AbilityButton({ icon, label, count, onClick, disabled, color }: any) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-1 p-3 border border-[#ECE8E1]/10 bg-[#17202b] transition-all
        ${disabled ? "opacity-30 grayscale cursor-not-allowed" : "hover:border-white/20 group"}
      `}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-display text-[8px] uppercase tracking-widest text-[#ECE8E1]/60 group-hover:text-white">
        {label}
      </div>
      <div 
        className="font-mono text-[10px] font-bold px-2 py-0.5 mt-1"
        style={{ backgroundColor: `${color}22`, color: color }}
      >
        {count}
      </div>

      {/* Charge bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0a141e]">
        <div 
          className="h-full transition-all duration-500" 
          style={{ width: `${(count / 1) * 100}%`, backgroundColor: color }}
        />
      </div>
    </motion.button>
  );
}
