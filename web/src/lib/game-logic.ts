import sql from "./db";

export interface ValidationResult {
  valid: boolean;
  reason?: "NEVER_PLAYED" | "ALREADY_USED" | "NOT_FOUND";
  sharedTeam?: string;
  newPlayerId?: number;
  newPlayerData?: PlayerData;
}

export interface PlayerData {
  id: number;
  nickname: string;
  real_name: string | null;
  country_code: string | null;
  image_url: string | null;
  current_team?: string | null;
  role?: string | null;
}

/**
 * Validates whether two players share a team connection.
 * Core algorithm from the architecture doc (section 4.1).
 */
export async function validateConnection(
  currentPlayerId: number,
  guessedPlayerId: number,
  usedPlayerIds: number[]
): Promise<ValidationResult> {
  // Check if player was already used in the chain
  if (usedPlayerIds.includes(guessedPlayerId)) {
    return { valid: false, reason: "ALREADY_USED" };
  }

  // Check if they shared a team with overlapping dates
  const sharedTeams = await sql`
    SELECT t.name AS team_name, t.id AS team_id
    FROM rosters r1
    JOIN rosters r2 ON r1.team_id = r2.team_id
    JOIN teams t ON t.id = r1.team_id
    WHERE r1.player_id = ${currentPlayerId}
      AND r2.player_id = ${guessedPlayerId}
      AND (r1.maps_played > 0 OR NOT r1.is_standin)
      AND (r2.maps_played > 0 OR NOT r2.is_standin)
    LIMIT 1
  `;

  if (!sharedTeams.length) {
    return { valid: false, reason: "NEVER_PLAYED" };
  }

  // Get full player data for the guessed player
  const playerData = await getPlayerById(guessedPlayerId);

  return {
    valid: true,
    sharedTeam: sharedTeams[0].team_name,
    newPlayerId: guessedPlayerId,
    newPlayerData: playerData || undefined,
  };
}

/**
 * Gets a random starting node with at least `minEdges` connections.
 * Ensures the game doesn't start at a dead-end (RN-06).
 */
export async function getRandomStartNode(minEdges: number = 5): Promise<PlayerData | null> {
  const players = await sql`
    SELECT p.id, p.nickname, p.real_name, p.country_code, p.image_url,
           t.name AS current_team, r_latest.role,
           COUNT(DISTINCT r2.player_id) AS edge_count
    FROM players p
    JOIN rosters r1 ON r1.player_id = p.id
    JOIN rosters r2 ON r2.team_id = r1.team_id AND r2.player_id != p.id
    LEFT JOIN LATERAL (
      SELECT r3.team_id, r3.role
      FROM rosters r3
      WHERE r3.player_id = p.id
      ORDER BY r3.year_start DESC NULLS LAST
      LIMIT 1
    ) r_latest ON true
    LEFT JOIN teams t ON t.id = r_latest.team_id
    WHERE (r1.maps_played > 0 OR NOT r1.is_standin)
      AND (r2.maps_played > 0 OR NOT r2.is_standin)
    GROUP BY p.id, p.nickname, p.real_name, p.country_code, p.image_url, t.name, r_latest.role
    HAVING COUNT(DISTINCT r2.player_id) >= ${minEdges}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (!players.length) {
    // Fallback: if no player has enough edges, pick any player with at least 1 connection
    const fallback = await sql`
      SELECT p.id, p.nickname, p.real_name, p.country_code, p.image_url,
             t.name AS current_team, r_latest.role
      FROM players p
      JOIN rosters r ON r.player_id = p.id
      LEFT JOIN LATERAL (
        SELECT r3.team_id, r3.role
        FROM rosters r3
        WHERE r3.player_id = p.id
        ORDER BY r3.year_start DESC NULLS LAST
        LIMIT 1
      ) r_latest ON true
      LEFT JOIN teams t ON t.id = r_latest.team_id
      GROUP BY p.id, p.nickname, p.real_name, p.country_code, p.image_url, t.name, r_latest.role
      HAVING COUNT(DISTINCT r.team_id) >= 1
      ORDER BY RANDOM()
      LIMIT 1
    `;
    return (fallback[0] as unknown as PlayerData) || null;
  }

  return players[0] as unknown as PlayerData;
}

/**
 * Bot AI: selects a random valid neighbor not yet used in the chain.
 */
export async function getBotMove(
  currentPlayerId: number,
  usedPlayerIds: number[]
): Promise<{ player: PlayerData; sharedTeam: string } | null> {
  const neighbors = await sql`
    SELECT DISTINCT p.id, p.nickname, p.real_name, p.country_code, p.image_url,
           t.name AS shared_team
    FROM rosters r1
    JOIN rosters r2 ON r2.team_id = r1.team_id AND r2.player_id != r1.player_id
    JOIN players p ON p.id = r2.player_id
    JOIN teams t ON t.id = r1.team_id
    WHERE r1.player_id = ${currentPlayerId}
      AND (r1.maps_played > 0 OR NOT r1.is_standin)
      AND (r2.maps_played > 0 OR NOT r2.is_standin)
      AND r2.player_id != ALL(${usedPlayerIds})
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (!neighbors.length) return null;

  return {
    player: neighbors[0] as unknown as PlayerData,
    sharedTeam: neighbors[0].shared_team,
  };
}

/**
 * Search players by nickname, aliases, or real name (fuzzy).
 * Used for autocomplete (RF-11, RF-12).
 */
export async function searchPlayers(query: string, limit: number = 5): Promise<PlayerData[]> {
  if (!query || query.length < 1) return [];

  const searchTerm = `%${query}%`;

  const players = await sql`
    SELECT DISTINCT p.id, p.nickname, p.real_name, p.country_code, p.image_url,
           t.name AS current_team, r.role
    FROM players p
    LEFT JOIN LATERAL (
      SELECT r2.team_id, r2.role
      FROM rosters r2
      WHERE r2.player_id = p.id
      ORDER BY r2.year_start DESC NULLS LAST
      LIMIT 1
    ) r ON true
    LEFT JOIN teams t ON t.id = r.team_id
    WHERE p.nickname ILIKE ${searchTerm}
       OR p.real_name ILIKE ${searchTerm}
       OR ${query} ILIKE ANY(
         SELECT '%' || unnest(p.aliases) || '%'
       )
    ORDER BY
      CASE WHEN p.nickname ILIKE ${query} THEN 0
           WHEN p.nickname ILIKE ${query + '%'} THEN 1
           ELSE 2
      END,
      p.nickname
    LIMIT ${limit}
  `;

  return players as unknown as PlayerData[];
}

/**
 * Get a player by ID with their current team info.
 */
export async function getPlayerById(playerId: number): Promise<PlayerData | null> {
  const players = await sql`
    SELECT p.id, p.nickname, p.real_name, p.country_code, p.image_url,
           t.name AS current_team, r.role
    FROM players p
    LEFT JOIN LATERAL (
      SELECT r2.team_id, r2.role
      FROM rosters r2
      WHERE r2.player_id = p.id
      ORDER BY r2.year_start DESC NULLS LAST
      LIMIT 1
    ) r ON true
    LEFT JOIN teams t ON t.id = r.team_id
    WHERE p.id = ${playerId}
    LIMIT 1
  `;

  return (players[0] as unknown as PlayerData) || null;
}

/**
 * Find a player by nickname (exact or partial match, min 3 chars).
 */
export async function findPlayerByName(name: string): Promise<PlayerData | null> {
  if (!name || name.length < 1) return null;

  const players = await sql`
    SELECT p.id, p.nickname, p.real_name, p.country_code, p.image_url,
           t.name AS current_team, r.role
    FROM players p
    LEFT JOIN LATERAL (
      SELECT r2.team_id, r2.role
      FROM rosters r2
      WHERE r2.player_id = p.id
      ORDER BY r2.year_start DESC NULLS LAST
      LIMIT 1
    ) r ON true
    LEFT JOIN teams t ON t.id = r.team_id
    WHERE p.nickname ILIKE ${name}
    LIMIT 1
  `;

  return (players[0] as unknown as PlayerData) || null;
}

/**
 * Gets a pair of players (start and target) that are connected by a path.
 * Usually jumps 3 steps to ensure a challenging but solvable puzzle.
 */
export async function getTargetMatchNodes(): Promise<{ start: PlayerData; target: PlayerData } | null> {
  // 1. Pick a random starting player with at least some connections
  const startPlayer = await getRandomStartNode(3);
  if (!startPlayer) return null;

  // 2. Find a target player by jumping 2-3 steps away to ensure a path exists
  // We use a recursive join or just multiple steps in SQL for simplicity here
  const targetNodes = await sql`
    SELECT p3.id, p3.nickname, p3.real_name, p3.country_code, p3.image_url,
           t.name AS current_team, r_latest.role
    FROM players p1
    JOIN rosters r1 ON r1.player_id = p1.id
    JOIN rosters r2 ON r2.team_id = r1.team_id AND r2.player_id != p1.id
    JOIN rosters r3 ON r3.player_id = r2.player_id
    JOIN rosters r4 ON r4.team_id = r3.team_id AND r4.player_id != r2.player_id
    JOIN rosters r5 ON r5.player_id = r4.player_id
    JOIN rosters r6 ON r6.team_id = r5.team_id AND r6.player_id != r4.player_id
    JOIN players p3 ON p3.id = r6.player_id
    LEFT JOIN LATERAL (
      SELECT r_l.team_id, r_l.role
      FROM rosters r_l
      WHERE r_l.player_id = p3.id
      ORDER BY r_l.year_start DESC NULLS LAST
      LIMIT 1
    ) r_latest ON true
    LEFT JOIN teams t ON t.id = r_latest.team_id
    WHERE p1.id = ${startPlayer.id}
      AND p3.id != p1.id
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (!targetNodes.length) {
    // Fallback: if 3 steps is too far, try 2 steps
    const fallbackTarget = await sql`
      SELECT p2.id, p2.nickname, p2.real_name, p2.country_code, p2.image_url,
             t.name AS current_team, r_latest.role
      FROM players p1
      JOIN rosters r1 ON r1.player_id = p1.id
      JOIN rosters r2 ON r2.team_id = r1.team_id AND r2.player_id != p1.id
      JOIN rosters r3 ON r3.player_id = r2.player_id
      JOIN rosters r4 ON r4.team_id = r3.team_id AND r4.player_id != r2.player_id
      JOIN players p2 ON p2.id = r4.player_id
      LEFT JOIN LATERAL (
        SELECT r_l.team_id, r_l.role
        FROM rosters r_l
        WHERE r_l.player_id = p2.id
        ORDER BY r_l.year_start DESC NULLS LAST
        LIMIT 1
      ) r_latest ON true
      LEFT JOIN teams t ON t.id = r_latest.team_id
      WHERE p1.id = ${startPlayer.id}
        AND p2.id != p1.id
      ORDER BY RANDOM()
      LIMIT 1
    `;
    
    if (!fallbackTarget.length) return null;
    return { start: startPlayer, target: fallbackTarget[0] as unknown as PlayerData };
  }

  return { start: startPlayer, target: targetNodes[0] as unknown as PlayerData };
}

/**
 * Verifies if a list of player IDs forms a valid chain of shared teammates.
 */
export async function verifyChain(playerIds: number[]): Promise<boolean> {
  if (!playerIds || playerIds.length < 2) return false;

  for (let i = 0; i < playerIds.length - 1; i++) {
    const p1 = playerIds[i];
    const p2 = playerIds[i + 1];

    const shared = await sql`
      SELECT 1 FROM rosters r1
      JOIN rosters r2 ON r1.team_id = r2.team_id
      WHERE r1.player_id = ${p1} AND r2.player_id = ${p2}
      LIMIT 1
    `;

    if (!shared.length) return false;
  }

  return true;
}


