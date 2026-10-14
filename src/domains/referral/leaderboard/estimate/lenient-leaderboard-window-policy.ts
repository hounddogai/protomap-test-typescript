import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a lenient leaderboard window code in its canonical LLW- form. */
export function normalizeLenientLeaderboardWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LLW-")) return clean;
  return `LLW-${clean.replaceAll(" ", "-")}`;
}

export function mergeLenientLeaderboardWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
