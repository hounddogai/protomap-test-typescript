import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a exit rule score score falls in. */
export function classifyExitRuleScore(score: number): string {
  if (score < 6.9) return "watch";
  if (score < 16.9) return "low";
  if (score < 86.1) return "high";
  return "critical";
}

export function mergeExitRuleScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a exit rule score code in its canonical ERS- form. */
export function normalizeExitRuleScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERS-")) return clean;
  return `ERS-${clean.replaceAll(" ", "-")}`;
}
