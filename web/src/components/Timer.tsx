import React from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeLeft: number;
}

export function Timer({ timeLeft }: TimerProps) {
  const isCritical = timeLeft <= 5;
  const timerDisplay = timeLeft.toString().padStart(2, '0');

  return (
    <header className="w-full flex justify-center py-10 relative">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Animated background pulse if critical */}
        {isCritical && (
          <motion.div 
            className="absolute inset-0 rounded-full bg-valorant-red blur-xl"
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
        
        {/* SVG Circle dash */}
        <svg className="absolute inset-0 w-full h-full text-surface-container" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="48" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Number */}
        <motion.div 
          className={`absolute inset-0 flex items-center justify-center font-display font-bold text-5xl z-10 ${
            isCritical ? 'text-valorant-red' : 'text-off-white'
          }`}
          style={{ textShadow: isCritical ? '0 0 10px rgba(255, 70, 85, 0.8)' : 'none' }}
          animate={isCritical ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          {timerDisplay}
        </motion.div>
      </div>
    </header>
  );
}
