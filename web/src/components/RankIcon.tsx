import React from "react";

interface RankIconProps {
  rank: string;
  size?: "sm" | "md" | "lg";
}

const RANK_COLORS: Record<string, string> = {
  Hierro: "#7b7b7b",
  Bronce: "#8c5230",
  Plata: "#b5b5b5",
  Oro: "#e7b75c",
  Platino: "#4da6c5",
  Diamante: "#b58efd",
  Ascendente: "#3eb27f",
  Inmortal: "#b92b45",
  Radiante: "#fffaaf",
};

export default function RankIcon({ rank, size = "md" }: RankIconProps) {
  const color = RANK_COLORS[rank] || "#fff";
  
  const sizeClasses = {
    sm: "w-8 h-8 text-[8px]",
    md: "w-16 h-16 text-[10px]",
    lg: "w-24 h-24 text-[14px]",
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} group`}>
      {/* Background glow */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: color }}
      />
      
      {/* Hexagon shape */}
      <div 
        className="absolute inset-0 clip-hexagon bg-gradient-to-br from-white/10 to-transparent border border-white/20"
        style={{ borderColor: `${color}44` }}
      />

      {/* Inner Rank Text */}
      <div className="relative font-display font-black uppercase tracking-tighter italic z-10 text-center leading-none" style={{ color }}>
        {rank}
      </div>

      <style jsx>{`
        .clip-hexagon {
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
      `}</style>
    </div>
  );
}
