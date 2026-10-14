import * as numbers from "../../../../kit/numbers.js";

/** Puts a leaderboard adjustment code in its canonical LA- form. */
export function normalizeLeaderboardAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LA-")) return clean;
  return `LA-${clean.replaceAll(" ", "-")}`;
}

export function leaderboardAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
