"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlayerCard from "@/components/PlayerCard";
import SearchInput from "@/components/SearchInput";
import ChainHistory from "@/components/ChainHistory";
import FeedbackToast from "@/components/FeedbackToast";

interface PlayerData {
  id: number;
  nickname: string;
  realName: string | null;
  countryCode: string | null;
  imageUrl: string | null;
  team?: string;
}

type GameStatus = "loading" | "playing" | "ended" | "already_played" | "unauthorized";

const MAX_ERRORS = 3;

export default function DailyPage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<GameStatus>("loading");
  
  const [startPlayer, setStartPlayer] = useState<PlayerData | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<PlayerData | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string>("");
  
  const [chain, setChain] = useState<{ playerId: number; nickname: string; team: string }[]>([]);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- INIT ---
  useEffect(() => {
    const initDaily = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        
        if (!authData.user) {
          setStatus("unauthorized");
          return;
        }
        setUser(authData.user);

        const dailyRes = await fetch("/api/daily");
        const dailyData = await dailyRes.json();

        if (dailyData.hasPlayed) {
          setStatus("already_played");
          return;
        }

        setStartPlayer(dailyData.startPlayer);
        setTargetPlayer(dailyData.targetPlayer);
        setCurrentPlayer(dailyData.startPlayer);
        
        setChain([{ playerId: dailyData.startPlayer.id, nickname: dailyData.startPlayer.nickname, team: "START" }]);
        setStatus("playing");

      } catch (error) {
        console.error("Failed to load daily mode", error);
      }
    };

    initDaily();
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ type, message });
    feedbackTimeoutRef.current = setTimeout(() => setFeedback({ type: null, message: "" }), 3000);
  };

  const endGame = useCallback(async (reason: string) => {
    setStatus("ended");
    
    if (reason === "target_reached") {
      setFeedback({ type: "success", message: "🎉 ¡RET0 DIARIO COMPLETADO!" });
    } else {
      setFeedback({ type: "error", message: "💀 Demasiados errores. Reto fallido." });
    }

    try {
      await fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          chainLength: chain.length,
          chainNodes: chain.map(c => c.playerId),
          durationSecs: 0,
        }),
      });
    } catch (error) {
      console.error("Failed to save daily match", error);
    }
  }, [chain]);

  const handleGuess = async (player: { id: number; nickname: string }) => {
    if (!currentPlayer) return;

    try {
      const res = await fetch("/api/match/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlayerId: currentPlayer.id,
          guessedPlayerId: player.id,
          usedPlayerIds: chain.map(c => c.playerId),
        }),
      });
      const data = await res.json();

      if (data.valid) {
        const fullPlayerData = await fetch(`/api/players?q=${player.nickname}`).then(r => r.json());
        const matchedPlayer = fullPlayerData.players.find((p: any) => p.id === player.id);

        setCurrentPlayer(matchedPlayer);
        setCurrentTeam(data.sharedTeam);
        setChain(prev => [...prev, { playerId: player.id, nickname: player.nickname, team: data.sharedTeam }]);
        setScore(s => s + 1);
        showFeedback("success", `¡Conexión en ${data.sharedTeam}!`);

        if (player.id === targetPlayer?.id) {
          setTimeout(() => endGame("target_reached"), 1000);
        }
      } else {
        const newErrors = errors + 1;
        setErrors(newErrors);
        
        if (data.reason === "ALREADY_USED") {
          showFeedback("error", "Ese jugador ya está en la cadena");
        } else {
          showFeedback("error", "Conexión inválida");
        }

        if (newErrors >= MAX_ERRORS) {
          setTimeout(() => endGame("errors"), 1000);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 20px", position: "relative"
    }}>
      <FeedbackToast type={feedback.type} message={feedback.message} />

      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", marginBottom: 24, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: "1.3rem", fontWeight: 900, fontStyle: "italic",
            letterSpacing: "-0.03em", color: "var(--accent-red)", cursor: "pointer"
          }} onClick={() => window.location.href = "/"}>
            SPIKELINK
          </span>
          <span className="tag tag-orange">DAILY</span>
        </div>

        {user && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{user.nickname}</div>
          </div>
        )}
      </header>

      {status === "loading" && (
        <div style={{ marginTop: 100, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Cargando reto del día...
        </div>
      )}

      {status === "unauthorized" && (
        <div className="game-card" style={{ marginTop: 60, textAlign: "center", padding: 40, maxWidth: 400 }}>
          <h2 style={{ color: "var(--accent-red)", marginBottom: 16 }}>Acceso Denegado</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Debes iniciar sesión para jugar al reto diario.</p>
          <button className="btn-primary" onClick={() => window.location.href = "/"}>
            Ir al Menú Principal
          </button>
        </div>
      )}

      {status === "already_played" && (
        <div className="game-card" style={{ marginTop: 60, textAlign: "center", padding: 40, maxWidth: 400 }}>
          <h2 style={{ color: "var(--accent-cyan)", marginBottom: 16 }}>¡Ya jugaste hoy!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>El reto diario solo se puede jugar una vez al día. Vuelve mañana para un nuevo desafío.</p>
          <button className="btn-primary" onClick={() => window.location.href = "/"}>
            Volver al Menú
          </button>
        </div>
      )}

      {(status === "playing" || status === "ended") && startPlayer && targetPlayer && currentPlayer && (
        <div style={{
          display: "flex", flexDirection: "column", width: "100%",
          maxWidth: 600, alignItems: "center", gap: 32, zIndex: 1, flex: 1
        }}>
          
          <div style={{
            width: "100%", padding: 16, background: "rgba(255, 70, 85, 0.1)",
            border: "1px solid rgba(255, 70, 85, 0.3)", borderRadius: 8, textAlign: "center"
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Objetivo del Día</span>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 4 }}>
              Conecta a <span style={{ color: "var(--accent-red)" }}>{startPlayer.nickname}</span> con <span style={{ color: "var(--accent-cyan)" }}>{targetPlayer.nickname}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
               <span className="tag tag-orange">❌ {errors}/{MAX_ERRORS}</span>
               <span className="tag tag-green">🔗 Pasos: {score}</span>
            </div>
          </div>

          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            width: "100%", gap: 24, padding: "32px 0"
          }}>
            <PlayerCard 
              nickname={currentPlayer.nickname}
              realName={currentPlayer.realName}
              countryCode={currentPlayer.countryCode}
              teamName={currentTeam} 
              isActive={true} 
            />
            
            {status === "playing" && (
              <div style={{ width: "100%", maxWidth: 400 }}>
                <SearchInput onSelect={handleGuess} disabled={false} placeholder="¿Con quién jugó?" />
              </div>
            )}
          </div>

          <div style={{ width: "100%", maxWidth: 400, marginTop: "auto" }}>
            <ChainHistory chain={chain} />
          </div>
        </div>
      )}

      {status === "ended" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card"
          style={{
            position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
            width: "90%", maxWidth: 400, padding: 32, textAlign: "center", zIndex: 100,
            background: "rgba(10, 20, 30, 0.95)", backdropFilter: "blur(10px)"
          }}
        >
          <h2 style={{ fontSize: "2rem", color: errors >= MAX_ERRORS ? "var(--accent-red)" : "var(--accent-cyan)", fontStyle: "italic", fontWeight: 900, marginBottom: 8 }}>
            {errors >= MAX_ERRORS ? "RETO FALLIDO" : "¡RETO COMPLETADO!"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            {errors >= MAX_ERRORS 
              ? "Has superado el límite de errores permitidos hoy." 
              : `Has logrado conectar a ${startPlayer?.nickname} con ${targetPlayer?.nickname} en ${score} pasos.`}
          </p>
          
          <button className="btn-primary" onClick={() => window.location.href = "/"} style={{ width: "100%", marginBottom: 12 }}>
            ← VOLVER AL MENÚ
          </button>
        </motion.div>
      )}
    </div>
  );
}
