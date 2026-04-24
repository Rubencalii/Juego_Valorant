"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  detail?: string;
}

interface ConnectionToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export function ConnectionToast({ toast, onDismiss }: ConnectionToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onDismiss, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-lg px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`relative border-2 p-4 overflow-hidden
              ${toast.type === "success"
                ? "bg-[#02e600]/10 border-[#02e600] text-[#02e600]"
                : "bg-[#FF4655]/10 border-[#FF4655] text-[#FF4655]"
              }`}
          >
            {/* Glitch overlay for errors */}
            {toast.type === "error" && (
              <motion.div
                className="absolute inset-0 bg-[#FF4655]/5"
                animate={{ x: [-2, 2, -1, 1, 0] }}
                transition={{ duration: 0.3, repeat: 2 }}
              />
            )}

            {/* Success particles */}
            {toast.type === "success" && (
              <>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#02e600]" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#02e600]" />
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#02e600]" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#02e600]" />
              </>
            )}

            <div className="relative z-10">
              <div className="font-display font-black text-lg uppercase tracking-tight">
                {toast.type === "success" ? "CONNECTION ESTABLISHED" : "CONNECTION FAILED"}
              </div>
              <div className="font-display text-xs uppercase tracking-widest mt-1 opacity-70">
                {toast.message}
              </div>
              {toast.detail && (
                <div className="font-mono text-[10px] mt-2 opacity-50">
                  {'>'} {toast.detail}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to create toast data
export function createToast(type: ToastType, message: string, detail?: string): ToastData {
  return {
    id: Date.now().toString(),
    type,
    message,
    detail,
  };
}
