import prisma from "./prisma";
import crypto from "crypto";

// Retos definidos manualmente para asegurar un nivel de dificultad interesante
// y garantizar que haya un camino válido.
const DAILY_CHALLENGES = [
  { start: "TenZ", target: "Boaster" },
  { start: "yay", target: "Derke" },
  { start: "Aspas", target: "Chronicle" },
  { start: "Stax", target: "Sacy" },
  { start: "ScreaM", target: "FNS" },
  { start: "cNed", target: "Keznit" },
  { start: "Alfajer", target: "Zekken" },
];

export async function getDailyChallenge() {
  // Use UTC date string to ensure everyone gets the same challenge at the same time
  const dateStr = new Date().toISOString().split("T")[0];
  
  // Hash the date string to get a deterministic index
  const hash = crypto.createHash('md5').update(dateStr).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % DAILY_CHALLENGES.length;
  
  const challenge = DAILY_CHALLENGES[index];

  // Fetch the actual player records from DB
  const [startPlayer, targetPlayer] = await Promise.all([
    prisma.player.findFirst({ where: { nickname: { equals: challenge.start, collation: 'NOCASE' } } }),
    prisma.player.findFirst({ where: { nickname: { equals: challenge.target, collation: 'NOCASE' } } })
  ]);

  return {
    dateStr,
    startPlayer,
    targetPlayer
  };
}
