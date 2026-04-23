"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        nickname,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid nickname or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Geometric Background Decorations */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] border-[1px] border-[#ff4655]/10 rotate-45 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] border-[1px] border-[#ff4655]/10 rotate-45 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a252e] border-t-4 border-[#ff4655] p-8 shadow-2xl z-10 relative"
      >
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="white">
            <path d="M10 10 L90 10 L90 90 L10 90 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="currentColor" />
          </svg>
        </div>

        <h1 className="text-4xl font-black text-[#ece8e1] mb-2 tracking-tighter uppercase italic">
          INICIAR <span className="text-[#ff4655]">SESIÓN</span>
        </h1>
        <p className="text-[#ece8e1]/60 mb-8 text-sm uppercase tracking-widest font-bold">
          Ingresa tus credenciales de Agente
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#ece8e1]/80 text-xs font-black uppercase tracking-widest mb-2">
              NICKNAME
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#0f1923] border border-[#ece8e1]/20 text-[#ece8e1] p-3 focus:border-[#ff4655] outline-none transition-colors font-mono"
              placeholder="JETT_MAIN_99"
              required
            />
          </div>

          <div>
            <label className="block text-[#ece8e1]/80 text-xs font-black uppercase tracking-widest mb-2">
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f1923] border border-[#ece8e1]/20 text-[#ece8e1] p-3 focus:border-[#ff4655] outline-none transition-colors font-mono"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#ff4655]/10 border-l-4 border-[#ff4655] p-3 text-[#ff4655] text-xs font-bold uppercase"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff4655] text-[#ece8e1] font-black py-4 uppercase tracking-[0.2em] hover:bg-[#ff4655]/90 transition-all disabled:opacity-50 relative group overflow-hidden"
          >
            <span className="relative z-10">{loading ? "CARGANDO..." : "AUTORIZAR"}</span>
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#ece8e1]/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-[#ece8e1]/40">¿Nuevo recluta?</span>
          <Link 
            href="/register" 
            className="text-[#ff4655] hover:underline transition-all"
          >
            CREAR CUENTA
          </Link>
        </div>
      </motion.div>

      <div className="mt-8 text-[#ece8e1]/20 text-[8px] font-bold tracking-[0.5em] uppercase">
        SPIKELINK // SYSTEM // PROTOCOL_04
      </div>
    </div>
  );
}
