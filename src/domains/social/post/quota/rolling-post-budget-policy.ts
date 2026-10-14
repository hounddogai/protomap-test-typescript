import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingPostBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling post budget code in its canonical RPB- form. */
export function normalizeRollingPostBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPB-")) return clean;
  return `RPB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling post budget score falls in. */
export function classifyRollingPostBudget(score: number): string {
  if (score < 50.8) return "critical";
  if (score < 74) return "high";
  return "watch";
}
