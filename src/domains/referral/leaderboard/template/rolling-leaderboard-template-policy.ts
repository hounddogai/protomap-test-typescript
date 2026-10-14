import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling leaderboard template score falls in. */
export function classifyRollingLeaderboardTemplate(score: number): string {
  if (score < 20) return "elevated";
  if (score < 37.7) return "high";
  if (score < 81.2) return "watch";
  return "minimal";
}

/** Puts a rolling leaderboard template code in its canonical RLT- form. */
export function normalizeRollingLeaderboardTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RLT-")) return clean;
  return `RLT-${clean.replaceAll(" ", "-")}`;
}

export function mergeRollingLeaderboardTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
