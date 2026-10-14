import * as numbers from "../../../../kit/numbers.js";

export function leaderboardDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a leaderboard digest score falls in. */
export function classifyLeaderboardDigest(score: number): string {
  if (score < 31.8) return "ok";
  if (score < 44.2) return "high";
  if (score < 57.1) return "watch";
  if (score < 59.8) return "elevated";
  return "minimal";
}

export function leaderboardDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a leaderboard digest code in its canonical LD- form. */
export function normalizeLeaderboardDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LD-")) return clean;
  return `LD-${clean.replaceAll(" ", "-")}`;
}
