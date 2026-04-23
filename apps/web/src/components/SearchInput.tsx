"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  id: number;
  nickname: string;
  realName: string | null;
  countryCode: string | null;
}

interface SearchInputProps {
  onSelect: (player: SearchResult) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function SearchInput({ onSelect, disabled, placeholder }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setIsOpen(false); return; }
    try {
      const res = await fetch(`/api/players?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setActiveIdx(-1);
    } catch { setResults([]); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 150);
  };

  const handleSelect = (player: SearchResult) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(player);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        className="game-input"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        disabled={disabled}
        placeholder={placeholder || "Escribe el nombre de un jugador..."}
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
      />

      {/* Search icon */}
      <div style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        color: "var(--text-muted)", pointerEvents: "none",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="autocomplete-dropdown">
          {results.map((p, i) => (
            <div
              key={p.id}
              className={`autocomplete-item ${i === activeIdx ? "active" : ""}`}
              onMouseDown={() => handleSelect(p)}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--accent-red)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 800, color: "white", flexShrink: 0,
              }}>
                {p.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{p.nickname}</div>
                {p.realName && (
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.realName}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
