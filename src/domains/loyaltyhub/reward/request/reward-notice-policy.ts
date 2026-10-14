import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRewardNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a reward notice score falls in. */
export function classifyRewardNotice(score: number): string {
  if (score < 41.2) return "ok";
  if (score < 78.3) return "critical";
  return "medium";
}

/** Puts a reward notice code in its canonical RN- form. */
export function normalizeRewardNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RN-")) return clean;
  return `RN-${clean.replaceAll(" ", "-")}`;
}
