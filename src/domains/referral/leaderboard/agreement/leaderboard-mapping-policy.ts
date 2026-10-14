import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function leaderboardMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a leaderboard mapping code in its canonical LM- form. */
export function normalizeLeaderboardMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LM-")) return clean;
  return `LM-${clean.replaceAll(" ", "-")}`;
}

export function mergeLeaderboardMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 75659.0, in order. */
export function leaderboardMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75659) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
