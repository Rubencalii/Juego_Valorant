"use client";

import { motion } from "framer-motion";

interface TimerCircleProps {
  timeLeft: number;
  maxTime: number;
  isRunning: boolean;
}

export default function TimerCircle({ timeLeft, maxTime, isRunning }: TimerCircleProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / maxTime) * circumference;

  const getColor = () => {
    if (timeLeft > 10) return "var(--accent-green)";
    if (timeLeft > 5) return "var(--accent-orange)";
    return "var(--accent-red)";
  };

  const getGlow = () => {
    if (timeLeft > 10) return "var(--accent-green-glow)";
    if (timeLeft > 5) return "var(--accent-orange-glow)";
    return "var(--accent-red-glow)";
  };

  return (
    <div className={`relative flex items-center justify-center ${timeLeft <= 5 && isRunning ? "timer-critical" : ""}`}
      style={{ width: 140, height: 140, borderRadius: "50%" }}>
      <svg width="140" height="140" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="6"
          opacity="0.3"
        />
        {/* Progress ring */}
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ filter: `drop-shadow(0 0 8px ${getGlow()})` }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      {/* Time display */}
      <div className="flex flex-col items-center z-10">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          style={{
            fontSize: "2.5rem",
            fontWeight: 900,
            fontFamily: "var(--font-mono)",
            color: getColor(),
            lineHeight: 1,
          }}
        >
          {timeLeft}
        </motion.span>
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
          SECONDS
        </span>
      </div>
    </div>
  );
}
