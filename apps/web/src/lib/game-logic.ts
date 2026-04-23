import prisma from "./prisma";

export interface ValidationResult {
  valid: boolean;
  reason?: "NEVER_PLAYED" | "ALREADY_USED" | "NOT_FOUND";
  sharedTeam?: string;
  newPlayerId?: number;
}

/**
 * Core validation: checks if two players ever shared an official team roster.
 */
export async function validateConnection(
  currentPlayerId: number,
  guessedPlayerId: number,
  usedPlayerIds: number[]
): Promise<ValidationResult> {
  if (usedPlayerIds.includes(guessedPlayerId)) {
    return { valid: false, reason: "ALREADY_USED" };
  }

  // Find shared team via overlapping roster stints
  const currentRosters = await prisma.roster.findMany({
    where: { playerId: currentPlayerId },
    include: { team: true },
  });

  const guessedRosters = await prisma.roster.findMany({
    where: { playerId: guessedPlayerId },
    include: { team: true },
  });

  for (const r1 of currentRosters) {
    for (const r2 of guessedRosters) {
      if (r1.teamId !== r2.teamId) continue;
      // Check maps played for stand-ins
      if (r1.isStandin && r1.mapsPlayed === 0) continue;
      if (r2.isStandin && r2.mapsPlayed === 0) continue;
      // Check date overlap
      const r1End = r1.yearEnd || new Date();
      const r2End = r2.yearEnd || new Date();
      if (r1.yearStart <= r2End && r2.yearStart <= r1End) {
        return {
          valid: true,
          sharedTeam: r1.team.name,
          newPlayerId: guessedPlayerId,
        };
      }
    }
  }

  return { valid: false, reason: "NEVER_PLAYED" };
}

/**
 * Get a list of all valid neighbours for a given player (for bot logic).
 */
export async function getPlayerNeighbours(
  playerId: number,
  usedPlayerIds: number[]
): Promise<{ id: number; nickname: string; team: string }[]> {
  const rosters = await prisma.roster.findMany({
    where: { playerId },
    include: { team: true },
  });

  const neighbours: { id: number; nickname: string; team: string }[] = [];
  const seen = new Set<number>();

  for (const r of rosters) {
    const teammates = await prisma.roster.findMany({
      where: {
        teamId: r.teamId,
        playerId: { not: playerId },
      },
      include: { player: true, team: true },
    });

    for (const tm of teammates) {
      if (seen.has(tm.playerId) || usedPlayerIds.includes(tm.playerId)) continue;
      // Check date overlap
      const rEnd = r.yearEnd || new Date();
      const tmEnd = tm.yearEnd || new Date();
      if (r.yearStart <= tmEnd && tm.yearStart <= rEnd) {
        // Check standin
        if (r.isStandin && r.mapsPlayed === 0) continue;
        if (tm.isStandin && tm.mapsPlayed === 0) continue;
        seen.add(tm.playerId);
        neighbours.push({ id: tm.playerId, nickname: tm.player.nickname, team: tm.team.name });
      }
    }
  }

  return neighbours;
}

/**
 * Pick a random starting player that has >= 5 connections.
 */
export async function pickStartingPlayer(): Promise<{
  id: number;
  nickname: string;
  realName: string | null;
  countryCode: string | null;
  imageUrl: string | null;
} | null> {
  const allPlayers = await prisma.player.findMany();

  // Shuffle
  const shuffled = allPlayers.sort(() => Math.random() - 0.5);

  for (const p of shuffled) {
    const neighbours = await getPlayerNeighbours(p.id, []);
    if (neighbours.length >= 5) {
      return {
        id: p.id,
        nickname: p.nickname,
        realName: p.realName,
        countryCode: p.countryCode,
        imageUrl: p.imageUrl,
      };
    }
  }

  // Fallback: return first player with most connections
  return shuffled[0]
    ? { id: shuffled[0].id, nickname: shuffled[0].nickname, realName: shuffled[0].realName, countryCode: shuffled[0].countryCode, imageUrl: shuffled[0].imageUrl }
    : null;
}
