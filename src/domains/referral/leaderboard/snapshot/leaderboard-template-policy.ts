import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLeaderboardTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a leaderboard template code in its canonical LT- form. */
export function normalizeLeaderboardTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LT-")) return clean;
  return `LT-${clean.replaceAll(" ", "-")}`;
}
