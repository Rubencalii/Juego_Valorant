import React from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeLeft: number;
}

export function Timer({ timeLeft }: TimerProps) {
  const isCritical = timeLeft <= 5;
  const isWarning = timeLeft > 5 && timeLeft <= 10;
  const timerDisplay = timeLeft.toString().padStart(2, '0');

  // Color based on time (RUI-02): green >10s, orange 5-10s, red pulsing <5s
  const timerColor = isCritical
    ? '#FF4655'
    : isWarning
      ? '#FF8C00'
      : '#02e600';

  const strokeColor = isCritical
    ? 'rgba(255, 70, 85, 0.6)'
    : isWarning
      ? 'rgba(255, 140, 0, 0.4)'
      : 'rgba(2, 230, 0, 0.3)';

  // Calculate stroke progress (circumference of circle with r=45)
  const circumference = 2 * Math.PI * 45;
  const progress = (timeLeft / 15) * circumference;

  return (
    <header className="w-full flex justify-center py-6 relative">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Animated background pulse if critical */}
        {isCritical && (
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ backgroundColor: timerColor }}
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}

        {/* SVG Circle — background track */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background dashed circle */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="rgba(44, 54, 65, 0.5)"
            strokeWidth="3"
            strokeDasharray="4 4"
          />

          {/* Progress circle */}
          <motion.circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        {/* Number */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center font-display font-bold text-5xl z-10"
          style={{
            color: timerColor,
            textShadow: isCritical
              ? `0 0 15px rgba(255, 70, 85, 0.8)`
              : isWarning
                ? `0 0 10px rgba(255, 140, 0, 0.5)`
                : 'none'
          }}
          animate={isCritical ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          {timerDisplay}
        </motion.div>
      </div>
    </header>
  );
}
