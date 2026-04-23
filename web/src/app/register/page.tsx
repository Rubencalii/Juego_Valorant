"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        router.push("/login?registered=true");
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
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] border-[1px] border-[#ff4655]/10 rotate-45 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] border-[1px] border-[#ff4655]/10 rotate-45 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a252e] border-t-4 border-[#ff4655] p-8 shadow-2xl z-10 relative"
      >
        <h1 className="text-4xl font-black text-[#ece8e1] mb-2 tracking-tighter uppercase italic">
          NUEVO <span className="text-[#ff4655]">AGENTE</span>
        </h1>
        <p className="text-[#ece8e1]/60 mb-8 text-sm uppercase tracking-widest font-bold">
          Regístrate para competir en SpikeLink
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#ece8e1]/80 text-xs font-black uppercase tracking-widest mb-2">
              NICKNAME
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#0f1923] border border-[#ece8e1]/20 text-[#ece8e1] p-3 focus:border-[#ff4655] outline-none transition-colors font-mono"
              placeholder="RAZE_LOVER_2024"
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

          <div>
            <label className="block text-[#ece8e1]/80 text-xs font-black uppercase tracking-widest mb-2">
              CONFIRMAR CONTRASEÑA
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            className="w-full bg-[#ff4655] text-[#ece8e1] font-black py-4 uppercase tracking-[0.2em] hover:bg-[#ff4655]/90 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "PROCESANDO..." : "REGISTRARSE"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#ece8e1]/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-[#ece8e1]/40">¿Ya tienes cuenta?</span>
          <Link 
            href="/login" 
            className="text-[#ff4655] hover:underline transition-all"
          >
            INICIAR SESIÓN
          </Link>
        </div>
      </motion.div>

      <div className="mt-8 text-[#ece8e1]/20 text-[8px] font-bold tracking-[0.5em] uppercase">
        SPIKELINK // SYSTEM // PROTOCOL_04
      </div>
    </div>
  );
}
