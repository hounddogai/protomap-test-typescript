import * as numbers from "../../../../kit/numbers.js";

export function leaderboardDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a leaderboard draft code in its canonical LD- form. */
export function normalizeLeaderboardDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LD-")) return clean;
  return `LD-${clean.replaceAll(" ", "-")}`;
}

export function leaderboardDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
