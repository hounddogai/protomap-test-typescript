import * as numbers from "../../../../kit/numbers.js";

export function pendingLeaderboardSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending leaderboard summary code in its canonical PLS- form. */
export function normalizePendingLeaderboardSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PLS-")) return clean;
  return `PLS-${clean.replaceAll(" ", "-")}`;
}
