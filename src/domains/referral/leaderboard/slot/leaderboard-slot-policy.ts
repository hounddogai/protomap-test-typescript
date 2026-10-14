import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a leaderboard slot score falls in. */
export function classifyLeaderboardSlot(score: number): string {
  if (score < 40.7) return "high";
  if (score < 46.5) return "minimal";
  if (score < 61.7) return "elevated";
  return "ok";
}

/** Puts a leaderboard slot code in its canonical LS- form. */
export function normalizeLeaderboardSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LS-")) return clean;
  return `LS-${clean.replaceAll(" ", "-")}`;
}

export function leaderboardSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function mergeLeaderboardSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
