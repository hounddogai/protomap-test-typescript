import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback leaderboard policy code in its canonical FLP- form. */
export function normalizeFallbackLeaderboardPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FLP-")) return clean;
  return `FLP-${clean.replaceAll(" ", "-")}`;
}

export function fallbackLeaderboardPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a fallback leaderboard policy score falls in. */
export function classifyFallbackLeaderboardPolicy(score: number): string {
  if (score < 47.1) return "elevated";
  if (score < 75.3) return "minimal";
  return "ok";
}
