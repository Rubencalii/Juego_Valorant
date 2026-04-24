"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerSuggestion {
  id: number;
  nickname: string;
  real_name: string | null;
  country_code: string | null;
  image_url: string | null;
  current_team: string | null;
  role: string | null;
}

interface AutocompleteDropdownProps {
  query: string;
  onSelect: (player: PlayerSuggestion) => void;
  isVisible: boolean;
}

export function AutocompleteDropdown({ query, onSelect, isVisible }: AutocompleteDropdownProps) {
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query || query.length < 1 || !isVisible) {
      setSuggestions([]);
      return;
    }

    // Debounce 150ms (RF-11)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/players?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.players || []);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isVisible]);

  if (!isVisible || (!suggestions.length && !loading)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="absolute top-full left-0 right-0 mt-1 z-50 border border-[#ECE8E1]/20 bg-[#0a141e] overflow-hidden"
      >
        {loading && (
          <div className="px-4 py-3 text-[#ECE8E1]/40 text-xs font-display uppercase tracking-widest flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
            SCANNING_DATABASE...
          </div>
        )}

        {!loading && suggestions.map((player, index) => (
          <motion.button
            key={player.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelect(player)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all border-l-2
              ${selectedIndex === index
                ? "bg-[#17202b] border-[#FF4655] text-[#ECE8E1]"
                : "border-transparent text-[#ECE8E1]/70 hover:bg-[#17202b] hover:border-[#FF4655]"
              }`}
          >
            {/* Player avatar or placeholder */}
            <div className="w-8 h-8 bg-[#17202b] border border-[#ECE8E1]/10 flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {player.image_url ? (
                <img src={player.image_url} alt="" className="w-full h-full object-cover grayscale" />
              ) : (
                <span className="text-[#ECE8E1]/20 text-xs font-display">?</span>
              )}
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm uppercase tracking-tight truncate">
                {player.nickname}
              </div>
              {player.current_team && (
                <div className="text-[10px] text-[#ECE8E1]/40 font-display uppercase tracking-widest truncate">
                  {player.current_team}
                </div>
              )}
            </div>

            {/* Role badge */}
            {player.role && (
              <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#FF4655]/60 shrink-0">
                {player.role}
              </span>
            )}

            {/* Country code */}
            {player.country_code && (
              <span className="text-[10px] text-[#ECE8E1]/30 font-mono shrink-0">
                {player.country_code}
              </span>
            )}
          </motion.button>
        ))}

        {!loading && suggestions.length === 0 && query.length >= 1 && (
          <div className="px-4 py-3 text-[#FF4655]/60 text-xs font-display uppercase tracking-widest">
            NO_MATCH_FOUND
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
