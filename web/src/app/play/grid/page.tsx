"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteDropdown } from "@/components/AutocompleteDropdown";
import { useSession } from "next-auth/react";

interface GridCell {
  playerId: number | null;
  nickname: string | null;
  imageUrl: string | null;
  isCorrect: boolean | null;
}

interface GridConfig {
  xAxis: { type: "team" | "region" | "role"; value: string; label: string }[];
  yAxis: { type: "team" | "region" | "role"; value: string; label: string }[];
}

export default function GridPage() {
  const { data: session } = useSession();
  const [grid, setGrid] = useState<GridCell[]>(Array(9).fill({ playerId: null, nickname: null, imageUrl: null, isCorrect: null }));
  const [config, setConfig] = useState<GridConfig | null>(null);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGridConfig();
  }, []);

  const fetchGridConfig = async () => {
    try {
      const res = await fetch("/api/grid/daily");
      const data = await res.json();
      setConfig(data.config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (index: number) => {
    if (grid[index].isCorrect) return;
    setActiveCell(index);
    setSearchQuery("");
  };

  const handleSelectPlayer = async (player: any) => {
    if (activeCell === null || !config) return;

    const row = Math.floor(activeCell / 3);
    const col = activeCell % 3;

    try {
      const res = await fetch("/api/grid/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          conditionX: config.xAxis[col],
          conditionY: config.yAxis[row],
        }),
      });
      const data = await res.json();

      if (data.valid) {
        const newGrid = [...grid];
        newGrid[activeCell] = {
          playerId: player.id,
          nickname: player.nickname,
          imageUrl: player.image_url,
          isCorrect: true,
        };
        setGrid(newGrid);
      } else {
        alert("Este jugador no cumple ambas condiciones.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveCell(null);
    }
  };

  if (loading || !config) return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col relative overflow-hidden font-body pt-24 pb-20">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      
      <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-5xl uppercase tracking-tighter italic mb-2">
            AGENT<span className="text-[#FF4655]">GRID</span>
          </h1>
          <p className="font-display text-[10px] uppercase tracking-[0.4em] text-[#ECE8E1]/40">
            IMMACULATE GRID // 9 CELDAS // 9 AGENTES
          </p>
        </div>

        {/* Grid UI */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto aspect-square">
          {/* Top-left empty corner */}
          <div className="bg-transparent" />
          
          {/* X Axis Labels */}
          {config.xAxis.map((label, i) => (
            <AxisLabel key={i} label={label.label} />
          ))}

          {/* Grid Rows */}
          {config.yAxis.map((yLabel, rowIdx) => (
            <React.Fragment key={rowIdx}>
              <AxisLabel label={yLabel.label} />
              {[0, 1, 2].map((colIdx) => {
                const cellIdx = rowIdx * 3 + colIdx;
                const cell = grid[cellIdx];
                return (
                  <div 
                    key={cellIdx}
                    onClick={() => handleCellClick(cellIdx)}
                    className={`aspect-square border border-[#ECE8E1]/10 bg-[#17202b] flex items-center justify-center relative cursor-pointer group transition-all
                      ${cell.isCorrect ? "bg-[#02e600]/10 border-[#02e600]/30" : "hover:border-[#FF4655]/50"}
                    `}
                  >
                    {cell.isCorrect ? (
                      <div className="flex flex-col items-center p-2 text-center">
                        {cell.imageUrl && <img src={cell.imageUrl} className="w-full h-full absolute inset-0 object-cover opacity-20 grayscale" alt="" />}
                        <span className="relative z-10 font-display font-black text-[8px] md:text-xs uppercase text-[#02e600]">{cell.nickname}</span>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 font-display text-[8px] uppercase tracking-widest text-[#FF4655]">SELECT</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {activeCell !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md bg-[#17202b] border border-[#ECE8E1]/20 p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-black text-xl uppercase tracking-tight">SELECCIONAR JUGADOR</h3>
                  <button onClick={() => setActiveCell(null)} className="text-[#ECE8E1]/40 hover:text-white">✕</button>
                </div>
                
                <div className="mb-4 p-3 bg-black/30 border-l-2 border-[#FF4655] text-[10px] font-display uppercase tracking-widest text-[#ECE8E1]/60">
                   {config.yAxis[Math.floor(activeCell / 3)].label} × {config.xAxis[activeCell % 3].label}
                </div>

                <div className="relative">
                  <input 
                    autoFocus
                    className="w-full bg-black/50 border border-[#ECE8E1]/10 px-4 py-3 font-display text-lg uppercase tracking-wider focus:border-[#FF4655] outline-none"
                    placeholder="BUSCAR NICKNAME..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <AutocompleteDropdown 
                    query={searchQuery} 
                    isVisible={searchQuery.length > 0} 
                    onSelect={handleSelectPlayer} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function AxisLabel({ label }: { label: string }) {
  return (
    <div className="aspect-square flex items-center justify-center text-center p-2">
      <span className="font-display font-black text-[8px] md:text-[10px] uppercase tracking-widest leading-tight text-[#ECE8E1]/60 italic">
        {label}
      </span>
    </div>
  );
}
