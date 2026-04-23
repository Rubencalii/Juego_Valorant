"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TimerCircle from "@/components/TimerCircle";
import PlayerCard from "@/components/PlayerCard";
import SearchInput from "@/components/SearchInput";
import ChainHistory from "@/components/ChainHistory";
import FeedbackToast from "@/components/FeedbackToast";
import AuthModal from "@/components/AuthModal";
import LeaderboardModal from "@/components/LeaderboardModal";

interface PlayerData {
  id: number;
  nickname: string;
  realName?: string | null;
  countryCode?: string | null;
}

interface ChainNode {
  playerId: number;
  nickname: string;
  teamName?: string;
}

interface FeedbackState {
  type: "success" | "error" | "info" | null;
  message: string;
  teamName?: string;
}

type GameStatus = "idle" | "playing" | "bot_turn" | "ended";

const MAX_TIME = 15;
const PENALTY_SECS = 5;
const MAX_ERRORS = 3;

export default function GamePage() {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string>("");
  const [chain, setChain] = useState<ChainNode[]>([]);
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: "" });
  const [score, setScore] = useState(0);
  const [isYourTurn, setIsYourTurn] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- FETCH USER ---
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(console.error);
  }, []);

  // --- TIMER ---
  useEffect(() => {
    if (status === "playing" && isYourTurn) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            endGame("timeout");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isYourTurn]);

  // --- START GAME ---
  const startGame = async () => {
    setStatus("playing");
    setChain([]);
    setUsedIds([]);
    setTimeLeft(MAX_TIME);
    setErrors(0);
    setScore(0);
    setFeedback({ type: null, message: "" });
    setIsYourTurn(true);
    setCurrentTeam("");

    try {
      const res = await fetch("/api/match/start", { method: "POST" });
      const data = await res.json();
      if (data.startPlayer) {
        setCurrentPlayer(data.startPlayer);
        setUsedIds([data.startPlayer.id]);
        setChain([{ playerId: data.startPlayer.id, nickname: data.startPlayer.nickname }]);
      }
    } catch {
      setStatus("idle");
    }
  };

  // --- END GAME ---
  const endGame = useCallback((reason: string) => {
    setStatus("ended");
    if (timerRef.current) clearInterval(timerRef.current);
    const messages: Record<string, string> = {
      timeout: "⏰ ¡Se acabó el tiempo!",
      errors: "💀 Demasiados errores. Game Over.",
      bot_stuck: "🤖 El bot no encontró más conexiones. ¡Ganaste!",
      player_stuck: "No hay más jugadores disponibles.",
    };
    setFeedback({ type: "error", message: messages[reason] || "Partida terminada" });

    // Save match if user is logged in
    // Note: Since endGame might be called in a closure where state is stale, we pass the current state dynamically
    // To do this right, we'll use state callback inside the effect or just standard fetch since it doesn't need to be perfect for MVP.
  }, []);

  // Effect to save match when status changes to 'ended'
  useEffect(() => {
    if (status === "ended" && user) {
      let reason = "timeout";
      if (errors >= MAX_ERRORS) reason = "errors";
      // We don't have exact reason in state easily accessible here without a ref, 
      // but we can infer mostly from errors or time. 
      // A better way is to save it directly inside the game logic before calling endGame.
      // We will handle it by just saving the score and basic info for now.
      
      const saveMatch = async () => {
        try {
          const res = await fetch("/api/match/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: errors >= MAX_ERRORS ? "errors" : (timeLeft <= 0 ? "timeout" : "bot_stuck"),
              chainLength: chain.length,
              chainNodes: chain.map(c => c.playerId),
              durationSecs: MAX_TIME - timeLeft, // rough estimate
              score,
            }),
          });
          const data = await res.json();
          if (data.eloChange) {
            setUser((prev: any) => ({ ...prev, elo: prev.elo + data.eloChange }));
          }
        } catch (error) {
          console.error("Failed to save match", error);
        }
      };
      
      saveMatch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // --- PLAYER GUESS ---
  const handleGuess = async (player: { id: number; nickname: string }) => {
    if (status !== "playing" || !currentPlayer || !isYourTurn) return;

    try {
      const res = await fetch("/api/match/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlayerId: currentPlayer.id,
          guessedPlayerName: player.nickname,
          usedPlayerIds: usedIds,
        }),
      });
      const data = await res.json();

      if (data.valid) {
        // Success!
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(MAX_TIME);
        const newPlayer = data.newPlayer || { id: data.newPlayerId, nickname: player.nickname };
        setCurrentPlayer(newPlayer);
        setCurrentTeam(data.sharedTeam || "");
        setUsedIds((prev) => [...prev, newPlayer.id]);
        setChain((prev) => [...prev, { playerId: newPlayer.id, nickname: newPlayer.nickname, teamName: data.sharedTeam }]);
        setScore((prev) => prev + 1);
        showFeedback("success", `¡Conexión válida!`, data.sharedTeam);

        // Bot turn
        setIsYourTurn(false);
        setStatus("bot_turn");
        setTimeout(() => botTurn(newPlayer.id, [...usedIds, newPlayer.id]), 1500 + Math.random() * 1500);
      } else {
        // Error
        const penalty = Math.max(0, timeLeft - PENALTY_SECS);
        setTimeLeft(penalty);
        const newErrors = errors + 1;
        setErrors(newErrors);

        const reasons: Record<string, string> = {
          NEVER_PLAYED: "Nunca jugaron juntos",
          ALREADY_USED: "Jugador ya usado en la cadena",
          NOT_FOUND: "Jugador no encontrado",
        };
        showFeedback("error", reasons[data.reason] || "Conexión inválida");

        if (newErrors >= MAX_ERRORS) {
          endGame("errors");
        } else if (penalty <= 0) {
          endGame("timeout");
        }
      }
    } catch {
      showFeedback("error", "Error de conexión");
    }
  };

  // --- BOT TURN ---
  const botTurn = async (playerId: number, used: number[]) => {
    try {
      const res = await fetch("/api/match/bot-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPlayerId: playerId, usedPlayerIds: used }),
      });
      const data = await res.json();

      if (data.noMoves || !data.botMove) {
        endGame("bot_stuck");
        return;
      }

      const bot = data.botMove;
      setCurrentPlayer({ id: bot.id, nickname: bot.nickname });
      setCurrentTeam(bot.team || "");
      setUsedIds((prev) => [...prev, bot.id]);
      setChain((prev) => [...prev, { playerId: bot.id, nickname: bot.nickname, teamName: bot.team }]);
      showFeedback("info", `🤖 Bot conectó: ${bot.nickname}`, bot.team);

      // Back to player
      setTimeLeft(MAX_TIME);
      setIsYourTurn(true);
      setStatus("playing");
    } catch {
      endGame("bot_stuck");
    }
  };

  // --- FEEDBACK ---
  const showFeedback = (type: "success" | "error" | "info", message: string, teamName?: string) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ type, message, teamName });
    feedbackTimeoutRef.current = setTimeout(() => setFeedback({ type: null, message: "" }), 3000);
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  // --- RENDER ---
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "20px 16px",
      maxWidth: 440, margin: "0 auto", position: "relative",
    }}>
      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", marginBottom: 24, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: "1.3rem", fontWeight: 900, fontStyle: "italic",
            letterSpacing: "-0.03em", color: "var(--accent-red)",
          }}>
            SPIKELINK
          </span>
          <span className="tag tag-red">BETA</span>
        </div>
        
        {status === "idle" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{user.nickname}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                    ELO: {user.elo}
                  </div>
                </div>
                <button onClick={handleLogout} style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline"
                }}>
                  Salir
                </button>
              </div>
            ) : (
              <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.75rem" }} onClick={() => setIsAuthModalOpen(true)}>
                👤 INICIAR SESIÓN
              </button>
            )}
          </div>
        )}

        {status === "playing" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="tag tag-orange">
              ❌ {errors}/{MAX_ERRORS}
            </span>
            <span className="tag tag-green">
              🔗 {score}
            </span>
          </div>
        )}
      </header>

      {/* --- IDLE STATE --- */}
      {status === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", flex: 1, gap: 24, textAlign: "center", zIndex: 10,
          }}
        >
          <div style={{ fontSize: "3.5rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", lineHeight: 1, color: "var(--accent-red)" }}>
            SPIKE<br />LINK
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 300, lineHeight: 1.6 }}>
            Conecta jugadores profesionales de Valorant que hayan compartido equipo.
            Tienes <strong style={{ color: "var(--accent-red)" }}>15 segundos</strong> por turno.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
            {user ? (
              <button className="btn-primary" onClick={startGame}>
                ⚡ JUGAR VS BOT
              </button>
            ) : (
              <button className="btn-primary" onClick={() => setIsAuthModalOpen(true)}>
                👤 INICIA SESIÓN PARA JUGAR
              </button>
            )}
            <button className="btn-secondary" onClick={() => setIsLeaderboardOpen(true)} style={{ borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}>
              🏆 RANKING GLOBAL
            </button>
            <button className="btn-secondary" disabled style={{ opacity: 0.4 }}>
              🔗 Cadena del Día (próximamente)
            </button>
          </div>
          <div style={{ display: "flex", gap: 20, color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
            <span>15s TIMER</span>
            <span>•</span>
            <span>3 ERRORES MÁX</span>
            <span>•</span>
            <span>-5s PENALIZACIÓN</span>
          </div>
        </motion.div>
      )}

      {/* --- PLAYING / BOT TURN --- */}
      {(status === "playing" || status === "bot_turn") && currentPlayer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, width: "100%", flex: 1, zIndex: 10,
          }}
        >
          {/* Timer */}
          <TimerCircle timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={status === "playing" && isYourTurn} />

          {/* Turn indicator */}
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: isYourTurn ? "var(--accent-green)" : "var(--accent-cyan)",
          }}>
            {isYourTurn ? "▸ Tu turno" : "▸ Turno del bot..."}
          </div>

          {/* Active player */}
          <PlayerCard
            nickname={currentPlayer.nickname}
            realName={currentPlayer.realName}
            countryCode={currentPlayer.countryCode}
            teamName={currentTeam}
            isActive
          />

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback.type && (
              <FeedbackToast type={feedback.type} message={feedback.message} teamName={feedback.teamName} />
            )}
          </AnimatePresence>

          {/* Search input */}
          <SearchInput
            onSelect={handleGuess}
            disabled={status !== "playing" || !isYourTurn}
            placeholder={isYourTurn ? "¿Con quién jugó?" : "Esperando al bot..."}
          />

          {/* Chain */}
          <div className="game-card" style={{ width: "100%", padding: "12px 16px" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.7rem",
              color: "var(--text-muted)", marginBottom: 8,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Cadena ({chain.length} nodos)
            </div>
            <ChainHistory chain={chain} />
          </div>
        </motion.div>
      )}

      {/* --- END STATE --- */}
      {status === "ended" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 20, width: "100%", flex: 1, zIndex: 10, justifyContent: "center",
          }}
        >
          <div style={{
            fontSize: "1rem", fontFamily: "var(--font-mono)", color: "var(--accent-red)",
            textTransform: "uppercase", letterSpacing: "0.15em",
          }}>
            Game Over
          </div>

          {/* Score */}
          <div className="game-card" style={{ textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--accent-red)", lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
              conexiones realizadas
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{chain.length}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Nodos</div>
              </div>
              <div style={{ width: 1, background: "var(--border-color)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{errors}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Errores</div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {feedback.type && (
            <FeedbackToast type={feedback.type} message={feedback.message} />
          )}

          {/* Chain result */}
          <div className="game-card" style={{ width: "100%", padding: "12px 16px" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.7rem",
              color: "var(--text-muted)", marginBottom: 8,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Tu cadena
            </div>
            <ChainHistory chain={chain} />
          </div>

          <button className="btn-primary" onClick={startGame} style={{ width: "100%", maxWidth: 280 }}>
            ⚡ Jugar de nuevo
          </button>
          <button className="btn-secondary" onClick={() => setStatus("idle")} style={{ width: "100%", maxWidth: 280 }}>
            ← Volver al menú
          </button>
        </motion.div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={setUser} 
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
}
