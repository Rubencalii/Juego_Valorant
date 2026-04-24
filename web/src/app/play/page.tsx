"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/use-socket";
import { PlayerCard } from "@/components/PlayerCard";
import { Timer } from "@/components/Timer";
import { SearchInput } from "@/components/SearchInput";
import { ChainHistory } from "@/components/ChainHistory";
import { ConnectionToast, createToast } from "@/components/ConnectionToast";
import { GameOverModal } from "@/components/GameOverModal";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerData {
  id: number;
  nickname: string;
  real_name: string | null;
  country_code: string | null;
  image_url: string | null;
  current_team?: string | null;
  role?: string | null;
}

interface ChainNode {
  playerId: number;
  nickname: string;
  sharedTeam?: string;
}

type GameState = "loading" | "playing" | "bot_thinking" | "game_over";
type ToastData = { id: string; type: "success" | "error"; message: string; detail?: string } | null;

export default function PlayPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <PlayPage />
    </Suspense>
  );
}

function PlayPage() {
  const { data: session } = useSession();
  const socket = useSocket();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "bot";
  const roomId = searchParams.get("roomId");
  const eloBet = parseInt(searchParams.get("bet") || "0");
  const startIdParam = searchParams.get("startId");
  const targetIdParam = searchParams.get("targetId");

  // Game state
  const [gameState, setGameState] = useState<GameState>("loading");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<PlayerData | null>(null);

  const [chain, setChain] = useState<ChainNode[]>([]);
  const [usedPlayerIds, setUsedPlayerIds] = useState<number[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | "timeout">("lose");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Toast
  const [toast, setToast] = useState<ToastData>(null);

  // Loading / search
  const [isVerifying, setIsVerifying] = useState(false);

  // Initialize game
  useEffect(() => {
    startNewGame();

    if (mode === "pvp" && socket) {
      socket.on("opponent_move", (data) => {
        // We could show what the opponent did, or just update the current player
        // For now, let's just update the game state to reflect the new shared player
        setToast(createToast("success", `OPONENTE → VIA ${data.sharedTeam}`, `${data.newNickname}`));
        setCurrentPlayer({
          id: data.newPlayerId,
          nickname: data.newNickname,
          real_name: null,
          country_code: null,
          image_url: null // We might need to fetch the full data if we want images
        });
        setUsedPlayerIds((prev) => [...prev, data.newPlayerId]);
        setChain((prev) => [...prev, { playerId: data.newPlayerId, nickname: data.newNickname, sharedTeam: data.sharedTeam }]);
        setTimeLeft(15);
        setIsPlayerTurn(true);
      });

      socket.on("game_over", ({ winnerId }) => {
        if (winnerId !== (session?.user as any)?.id) {
          handleGameOver("lose");
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("opponent_move");
        socket.off("game_over");
      }
    };
  }, [mode, socket, session]);

  const startNewGame = async () => {
    setGameState("loading");
    setChain([]);
    setUsedPlayerIds([]);
    setErrorCount(0);
    setTimeLeft(15);
    setTimerActive(false);
    setIsPlayerTurn(true);
    startTimeRef.current = Date.now();

    try {
      const isDaily = mode === "daily";
      const isPvp = mode === "pvp";
      
      let endpoint = isDaily ? "/api/match/daily" : "/api/match/start";
      let fetchOptions: any = isDaily 
        ? { method: "GET" } 
        : { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode }),
          };

      // Special case for PVP: fetch the specific players agreed upon via socket
      if (isPvp && startIdParam && targetIdParam) {
        // We can just fetch the players by ID directly to be safe
        const resStart = await fetch(`/api/players/${startIdParam}`);
        const resTarget = await fetch(`/api/players/${targetIdParam}`);
        const dataStart = await resStart.json();
        const dataTarget = await resTarget.json();
        
        setCurrentPlayer(dataStart);
        setTargetPlayer(dataTarget);
        setUsedPlayerIds([dataStart.id]);
        setChain([{ playerId: dataStart.id, nickname: dataStart.nickname }]);
        setGameState("playing");
        setTimerActive(true);
        return;
      }

      const res = await fetch(endpoint, fetchOptions);

      const data = await res.json();

      if (!res.ok || !data.startPlayer) {
        console.error("Failed to start match:", data);
        return;
      }

      const player = data.startPlayer;
      const target = data.targetPlayer;
      setCurrentPlayer(player);
      setTargetPlayer(target);
      setUsedPlayerIds([player.id]);
      setChain([{ playerId: player.id, nickname: player.nickname }]);
      setGameState("playing");
      setTimerActive(true);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const handleGameOver = useCallback(async (reason: "win" | "lose" | "timeout") => {
    setTimerActive(false);
    setResult(reason);
    setGameState("game_over");

    // Save result if authenticated
    if (session?.user) {
      if (mode === "pvp" && reason === "win") {
        socket?.emit("win_match", {
          roomId,
          userId: (session.user as any).id,
          chainLength: chain.length,
          durationSecs: Math.floor((Date.now() - startTimeRef.current) / 1000),
          chainNodes: chain.map(n => n.playerId)
        });
      } else if (mode !== "pvp") {
        try {
          await fetch("/api/match/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode,
              chainLength: chain.length,
              result: reason === "win" ? "win" : "lose",
              durationSecs: Math.floor((Date.now() - startTimeRef.current) / 1000),
              chainNodes: chain.map(n => n.playerId),
            }),
          });
        } catch (error) {
          console.error("Failed to save match result:", error);
        }
      }
    }
  }, [session, mode, chain, startTimeRef]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || gameState !== "playing") return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, gameState, handleGameOver]);

  // Player makes a guess
  const handleGuess = async (guessedName: string) => {
    if (gameState !== "playing" || !currentPlayer || isVerifying || !isPlayerTurn) return;

    setIsVerifying(true);

    try {
      const res = await fetch("/api/match/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlayerId: currentPlayer.id,
          guessedPlayerName: guessedName,
          usedPlayerIds,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        // ✅ Connection is valid
        const newPlayer = data.newPlayerData;
        setToast(createToast("success", `VIA ${data.sharedTeam}`, `${currentPlayer.nickname} → ${newPlayer.nickname}`));

        setCurrentPlayer(newPlayer);
        setUsedPlayerIds((prev) => [...prev, newPlayer.id]);
        setChain((prev) => [...prev, { playerId: newPlayer.id, nickname: newPlayer.nickname, sharedTeam: data.sharedTeam }]);
        setTimeLeft(15);

        // Check if TARGET reached
        if (newPlayer.id === targetPlayer?.id) {
          handleGameOver("win");
          return;
        }

        // Handle Mode specific transitions
        if (mode === "bot") {
          setIsPlayerTurn(false);
          setGameState("bot_thinking");
          setTimeout(() => handleBotTurn(newPlayer.id, [...usedPlayerIds, newPlayer.id]), 1500 + Math.random() * 1000);
        } else if (mode === "pvp") {
          setIsPlayerTurn(false);
          socket?.emit("submit_move", {
            roomId,
            playerId: currentPlayer.id,
            nickname: currentPlayer.nickname,
            newPlayerId: newPlayer.id,
            newNickname: newPlayer.nickname,
            sharedTeam: data.sharedTeam
          });
        }
      } else {
        // ❌ Connection failed
        const reasonMessages: Record<string, string> = {
          NEVER_PLAYED: "Estos jugadores nunca compartieron equipo",
          ALREADY_USED: "Este jugador ya fue usado en la cadena",
          NOT_FOUND: "Jugador no encontrado en la base de datos",
        };

        setToast(createToast("error", reasonMessages[data.reason] || "Conexión inválida", `REASON: ${data.reason}`));

        // Penalty: -5 seconds (RF-15)
        setTimeLeft((prev) => Math.max(0, prev - 5));
        setErrorCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleGameOver("lose");
          }
          return newCount;
        });
      }
    } catch (error) {
      console.error("Verify error:", error);
      setToast(createToast("error", "Error de conexión con el servidor", "SYS_ERROR"));
    } finally {
      setIsVerifying(false);
    }
  };

  // Bot makes a move
  const handleBotTurn = async (currentId: number, usedIds: number[]) => {
    try {
      const res = await fetch("/api/match/bot-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPlayerId: currentId, usedPlayerIds: usedIds }),
      });

      const data = await res.json();

      if (data.player) {
        setToast(createToast("success", `BOT → VIA ${data.sharedTeam}`, `${data.player.nickname}`));

        setCurrentPlayer(data.player);
        setUsedPlayerIds((prev) => [...prev, data.player.id]);
        setChain((prev) => [...prev, { playerId: data.player.id, nickname: data.player.nickname, sharedTeam: data.sharedTeam }]);
        setTimeLeft(15);

        // Check if TARGET reached by BOT
        if (data.player.id === targetPlayer?.id) {
          handleGameOver("lose"); // BOT reached it first!
          return;
        }

        setIsPlayerTurn(true);
        setGameState("playing");
      } else {
        // Bot can't find a move — player wins!
        handleGameOver("win");
      }
    } catch {
      // Bot error — player wins by default
      handleGameOver("win");
    }
  };

  const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col relative overflow-hidden font-body">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline z-50" />
      <div className="absolute inset-0 pointer-events-none diagonal-bg" />

      {/* Connection Toast */}
      <ConnectionToast toast={toast} onDismiss={() => setToast(null)} />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameState === "game_over"}
        result={result}
        chain={chain}
        chainLength={chain.length}
        durationSecs={totalDuration}
        onPlayAgain={startNewGame}
      />

      {/* Loading State */}
      {gameState === "loading" && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-8 h-8 border-2 border-[#FF4655] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="font-display text-xs uppercase tracking-widest text-[#ECE8E1]/40">
              INITIALIZING_MATCH...
            </div>
          </motion.div>
        </div>
      )}

      {/* Game Active */}
      {gameState !== "loading" && (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center relative z-10 pt-28 pb-32 px-4">
          {/* Mode indicator */}
          <div className="text-[10px] font-display font-bold text-[#FF4655] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#FF4655] animate-pulse" />
            MODE: {mode.toUpperCase()} {"// "} CHAIN: {chain.length} {"// "} ERRORS: {errorCount}/3
          </div>

          {/* Turn indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isPlayerTurn ? "player" : "bot"}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`text-xs font-display font-bold uppercase tracking-widest mb-4 px-3 py-1 
                ${isPlayerTurn 
                  ? "text-[#02e600] bg-[#02e600]/10 border border-[#02e600]/30" 
                  : "text-[#FFB3B2] bg-[#FFB3B2]/10 border border-[#FFB3B2]/30"
                }`}
            >
              {isPlayerTurn ? "// TU TURNO" : "// BOT PENSANDO..."}
            </motion.div>
          </AnimatePresence>

          {/* Timer */}
          <Timer timeLeft={timeLeft} />

          {/* Player Cards */}
          <div className="relative w-full flex flex-col md:flex-row items-center justify-center gap-2 md:gap-24 mt-8 mb-8">
            {/* Current player (active) */}
            {currentPlayer && (
              <motion.div
                key={currentPlayer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <PlayerCard
                  nickname={currentPlayer.nickname}
                  realName={currentPlayer.real_name || undefined}
                  role={currentPlayer.role || currentPlayer.current_team || "Unknown"}
                  kd="—"
                  isOnline={true}
                  imageUrl={currentPlayer.image_url || undefined}
                />
              </motion.div>
            )}

            {/* Connection indicator */}
            <div className="md:absolute top-1/2 left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex items-center justify-center -my-6 md:my-0 z-20">
              <motion.div
                className="w-4 h-4 bg-[#FF4655] rotate-45 border border-[#ECE8E1]/20 shadow-[0_0_15px_rgba(255,70,85,0.5)]"
                animate={{ scale: [1, 1.3, 1], rotate: 45 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>

            {/* Opponent / Target */}
            <div className={`${gameState === "bot_thinking" ? "opacity-70 animate-pulse scale-[1.02]" : ""} transition-all`}>
              {targetPlayer ? (
                <PlayerCard
                  nickname={targetPlayer.nickname}
                  realName={targetPlayer.real_name || undefined}
                  role={targetPlayer.role || targetPlayer.current_team || "TARGET"}
                  kd="META"
                  isOnline={false}
                  imageUrl={targetPlayer.image_url || undefined}
                />
              ) : (
                <PlayerCard
                  nickname={gameState === "bot_thinking" ? "SCANNING..." : "???"}
                  role={gameState === "bot_thinking" ? "PROCESSING" : "UNKNOWN"}
                  kd="—"
                  isOnline={gameState === "bot_thinking"}
                />
              )}
            </div>
          </div>

          {/* Search Input — only when it's player's turn */}
          {isPlayerTurn && gameState === "playing" && (
            <SearchInput onSearch={handleGuess} isLoading={isVerifying} />
          )}

          {/* Chain History */}
          <ChainHistory chain={chain} />
        </div>
      )}
    </main>
  );
}
