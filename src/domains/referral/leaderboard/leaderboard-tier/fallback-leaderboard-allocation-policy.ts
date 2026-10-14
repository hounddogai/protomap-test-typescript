import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback leaderboard allocation code in its canonical FLA- form. */
export function normalizeFallbackLeaderboardAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FLA-")) return clean;
  return `FLA-${clean.replaceAll(" ", "-")}`;
}

export function fallbackLeaderboardAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
