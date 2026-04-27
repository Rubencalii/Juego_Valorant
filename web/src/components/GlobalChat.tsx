"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";

interface Message {
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
}

export function GlobalChat() {
  const { data: session } = useSession();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("global_chat_received", (msg: Message) => {
      setMessages((prev) => [...prev.slice(-49), msg]);
    });

    return () => {
      socket.off("global_chat_received");
    };
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user || !socket) return;

    const user = session.user as any;
    socket.emit("global_chat_message", {
      userId: user.id,
      nickname: user.name,
      message: input.trim(),
    });
    setInput("");
  };

  return (
    <div className="w-full h-[400px] bg-[#17202b] border border-[#ECE8E1]/10 flex flex-col overflow-hidden">
      <div className="px-4 py-2 bg-black/20 border-b border-[#ECE8E1]/5 flex items-center justify-between">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF4655]">CHAT GLOBAL</span>
        <span className="w-2 h-2 bg-[#02e600] rounded-full animate-pulse" />
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center py-8 text-[#ECE8E1]/20 font-display text-[10px] uppercase tracking-widest">
            COMIENZA LA CONVERSACIÓN...
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              key={msg.timestamp + i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-0.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-[10px] uppercase text-[#FF4655] italic">
                  {msg.nickname}
                </span>
                <span className="text-[8px] text-[#ECE8E1]/20 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-[#ECE8E1]/80 leading-tight">
                {msg.message}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-4 bg-black/10 border-t border-[#ECE8E1]/5">
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder={session?.user ? "ESCRIBE UN MENSAJE..." : "INICIA SESIÓN PARA CHATEAR"}
            disabled={!session?.user}
            className="flex-1 bg-black/30 border border-[#ECE8E1]/10 px-3 py-2 text-sm outline-none focus:border-[#FF4655] transition-all disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!session?.user || !input.trim()}
            className="bg-[#FF4655] text-white px-4 py-2 font-display font-black text-xs uppercase tracking-widest hover:bg-[#FF4655]/80 transition-all disabled:opacity-30"
          >
            ENVIAR
          </button>
        </div>
      </form>
    </div>
  );
}
