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
           COUNT(DISTINCT r2.player_id) AS edge_count
    FROM players p
    JOIN rosters r1 ON r1.player_id = p.id
    JOIN rosters r2 ON r2.team_id = r1.team_id AND r2.player_id != p.id
    WHERE (r1.maps_played > 0 OR NOT r1.is_standin)
      AND (r2.maps_played > 0 OR NOT r2.is_standin)
    GROUP BY p.id, p.nickname, p.real_name, p.country_code, p.image_url
    HAVING COUNT(DISTINCT r2.player_id) >= ${minEdges}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (!players.length) {
    // Fallback: if no player has enough edges, pick any player with at least 1 connection
    const fallback = await sql`
      SELECT p.id, p.nickname, p.real_name, p.country_code, p.image_url
      FROM players p
      JOIN rosters r ON r.player_id = p.id
      GROUP BY p.id, p.nickname, p.real_name, p.country_code, p.image_url
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
