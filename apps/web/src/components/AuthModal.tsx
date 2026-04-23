"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error");
      } else {
        onSuccess(data.user);
        onClose();
        setNickname("");
        setPassword("");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(10, 20, 30, 0.8)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            className="game-card"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: "90%",
              maxWidth: 400,
              zIndex: 101,
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center" }}>
              <h2 style={{
                fontSize: "1.8rem", fontWeight: 900, fontStyle: "italic",
                color: "var(--text-primary)", letterSpacing: "-0.02em",
              }}>
                {mode === "login" ? "INICIAR SESIÓN" : "REGISTRO"}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 8 }}>
                {mode === "login" 
                  ? "Accede para guardar tu progreso y puntuación." 
                  : "Crea una cuenta para competir en los rankings."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{
                  display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase"
                }}>
                  Nickname
                </label>
                <input
                  type="text"
                  className="game-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Tu nombre de jugador"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                />
              </div>

              <div>
                <label style={{
                  display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase"
                }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  className="game-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="glitch-text"
                  style={{
                    color: "var(--accent-red)", fontSize: "0.8rem",
                    padding: "8px 12px", background: "rgba(255, 70, 85, 0.1)",
                    borderRadius: 6, border: "1px solid rgba(255, 70, 85, 0.2)",
                  }}
                >
                  ❌ {error}
                </motion.div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isLoading}
                style={{ marginTop: 8, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? "CARGANDO..." : (mode === "login" ? "ENTRAR" : "CREAR CUENTA")}
              </button>
            </form>

            {/* Footer toggle */}
            <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                style={{
                  background: "none", border: "none", color: "var(--accent-cyan)",
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {mode === "login" ? "Regístrate aquí" : "Inicia sesión"}
              </button>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none", color: "var(--text-muted)",
                cursor: "pointer", fontSize: "1.2rem", padding: 4,
              }}
            >
              ✕
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
