/** Names the band a rolling leaderboard assignment score falls in. */
export function classifyRollingLeaderboardAssignment(score: number): string {
  if (score < 14.1) return "minimal";
  if (score < 63.2) return "medium";
  if (score < 92.8) return "ok";
  return "high";
}

/** Puts a rolling leaderboard assignment code in its canonical RLA- form. */
export function normalizeRollingLeaderboardAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RLA-")) return clean;
  return `RLA-${clean.replaceAll(" ", "-")}`;
}
