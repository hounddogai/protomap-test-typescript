/** Names the band a strict leaderboard checkpoint score falls in. */
export function classifyStrictLeaderboardCheckpoint(score: number): string {
  if (score < 65.6) return "low";
  if (score < 70.1) return "medium";
  if (score < 75) return "ok";
  return "elevated";
}

/** Puts a strict leaderboard checkpoint code in its canonical SLC- form. */
export function normalizeStrictLeaderboardCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLC-")) return clean;
  return `SLC-${clean.replaceAll(" ", "-")}`;
}
