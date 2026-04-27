import sql from "./db";

export async function addPoints(userId: string, points: number) {
  try {
    await sql`
      UPDATE users 
      SET total_points = total_points + ${points},
          elo = elo + ${Math.floor(points / 10)}
      WHERE id = ${userId}
    `;
    return true;
  } catch (error) {
    console.error("Failed to add points:", error);
    return false;
  }
}

export function calculatePoints(game: string, data: any) {
  switch (game) {
    case "spikelink":
      // length * 10 + time bonus
      return (data.chainLength * 15) + (data.timeLeft || 0);
    case "guess":
      // 100 - (tries * 10)
      return Math.max(10, 100 - (data.tries * 10));
    case "grid":
      // cells * 20
      return data.cellsCompleted * 20;
    case "higher_lower":
      // streak * 5
      return data.streak * 5;
    default:
      return 0;
  }
}
