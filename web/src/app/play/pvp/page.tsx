"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PVPPage() {
  const { data: session, status } = useSession();
  const socket = useSocket();
  const router = useRouter();

  const [mode, setMode] = useState<"lobby" | "create" | "join" | "waiting">("lobby");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [eloBet, setEloBet] = useState(50);
  const [roomInfo, setRoomInfo] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!socket) return;

    socket.on("room_created", ({ roomId }) => {
      setRoomInfo({ id: roomId });
      setMode("waiting");
    });

    socket.on("match_starting", async ({ eloBet: serverEloBet }) => {
      // Only the creator (who is already in the room state) fetches the initial data
      if (mode === "waiting") {
        try {
          const res = await fetch("/api/match/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "pvp" }),
          });
          const data = await res.json();
          socket.emit("start_match", { 
            roomId: roomInfo?.id, 
            startPlayer: data.startPlayer, 
            targetPlayer: data.targetPlayer 
          });
          
          router.push(`/play?mode=pvp&roomId=${roomInfo?.id}&bet=${serverEloBet}&startId=${data.startPlayer.id}&targetId=${data.targetPlayer.id}`);
        } catch (err) {
          console.error("Failed to fetch PVP match data:", err);
        }
      }
    });

    socket.on("match_data", ({ startPlayer, targetPlayer }) => {
      // Guest receives data and navigates
      router.push(`/play?mode=pvp&roomId=${roomIdInput}&bet=${eloBet}&startId=${startPlayer.id}&targetId=${targetPlayer.id}`);
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("room_created");
      socket.off("match_starting");
      socket.off("match_data");
      socket.off("error");
    };
  }, [socket, router, roomInfo, roomIdInput, eloBet, mode]);

  const handleCreate = () => {
    if (!session?.user) return;
    const user = session.user as { id: string; name?: string };
    socket?.emit("create_room", { 
      userId: user.id, 
      nickname: user.name, 
      eloBet 
    });
  };

  const handleJoin = () => {
    if (!session?.user || !roomIdInput) return;
    const user = session.user as { id: string; name?: string };
    socket?.emit("join_room", { 
      roomId: roomIdInput.toUpperCase(), 
      userId: user.id, 
      nickname: user.name 
    });
  };

  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#ece8e1] flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline" />
      
      <div className="w-full max-w-md bg-[#17202b] border border-[#ECE8E1]/10 p-8 relative z-10">
        <h1 className="font-display font-black text-4xl uppercase tracking-tight italic mb-8 text-center">
          PVP <span className="text-[#FF4655]">DUEL</span>
        </h1>

        {mode === "lobby" && (
          <div className="space-y-4">
            <button 
              onClick={() => setMode("create")}
              className="w-full bg-[#FF4655] text-white font-display font-black py-4 uppercase tracking-widest hover:bg-[#FF4655]/90 transition-all"
            >
              CREAR SALA (APUESTA)
            </button>
            <button 
              onClick={() => setMode("join")}
              className="w-full border border-[#ECE8E1]/20 text-white font-display font-black py-4 uppercase tracking-widest hover:bg-[#ECE8E1]/5 transition-all"
            >
              UNIRSE CON CÓDIGO
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-6">
            <div>
              <label className="block font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-2">
                APUESTA DE ELO
              </label>
              <input 
                type="number"
                value={eloBet}
                onChange={(e) => setEloBet(parseInt(e.target.value))}
                className="w-full bg-black/50 border border-[#ECE8E1]/10 px-4 py-3 font-mono text-xl text-[#02e600]"
              />
              <p className="text-[10px] text-[#ECE8E1]/30 mt-2">
                *Si pierdes, se te restará esta cantidad. Si ganas, te llevas la del rival.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode("lobby")} className="flex-1 text-xs font-display text-[#ECE8E1]/40 uppercase tracking-widest">VOLVER</button>
              <button onClick={handleCreate} className="flex-[2] bg-[#FF4655] text-white font-display font-black py-3 uppercase tracking-widest">CREAR PARTIDA</button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-6">
            <div>
              <label className="block font-display text-[10px] uppercase tracking-widest text-[#ECE8E1]/40 mb-2">
                CÓDIGO DE SALA
              </label>
              <input 
                type="text"
                placeholder="EJ: XJ7Y2A"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                className="w-full bg-black/50 border border-[#ECE8E1]/10 px-4 py-3 font-display text-2xl text-center text-[#FF4655] placeholder:opacity-20"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode("lobby")} className="flex-1 text-xs font-display text-[#ECE8E1]/40 uppercase tracking-widest">VOLVER</button>
              <button onClick={handleJoin} className="flex-[2] bg-[#02e600] text-black font-display font-black py-3 uppercase tracking-widest">ENTRAR AL DUELO</button>
            </div>
          </div>
        )}

        {mode === "waiting" && roomInfo && (
          <div className="text-center py-8">
            <div className="text-[10px] font-display text-[#ECE8E1]/40 uppercase tracking-[0.5em] mb-4">ESPERANDO OPONENTE...</div>
            <div className="text-6xl font-display font-black text-[#FF4655] mb-6 tracking-tighter">
              {roomInfo.id}
            </div>
            <p className="text-xs text-[#ECE8E1]/50 uppercase tracking-widest leading-relaxed">
              Comparte este código con tu amigo para empezar el duelo.
            </p>
            <button onClick={() => setMode("lobby")} className="mt-8 text-xs font-display text-[#FF4655]/60 hover:text-[#FF4655] uppercase tracking-widest">CANCELAR</button>
          </div>
        )}
      </div>
    </main>
  );
}
