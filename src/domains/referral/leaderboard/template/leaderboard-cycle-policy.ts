import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function leaderboardCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Puts a leaderboard cycle code in its canonical LC- form. */
export function normalizeLeaderboardCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LC-")) return clean;
  return `LC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a leaderboard cycle score falls in. */
export function classifyLeaderboardCycle(score: number): string {
  if (score < 2.8) return "critical";
  if (score < 4.6) return "high";
  if (score < 22.2) return "watch";
  if (score < 84.1) return "elevated";
  return "minimal";
}

export function mergeLeaderboardCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
