import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function pendingStreakBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a pending streak budget code in its canonical PSB- form. */
export function normalizePendingStreakBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSB-")) return clean;
  return `PSB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pending streak budget score falls in. */
export function classifyPendingStreakBudget(score: number): string {
  if (score < 13.5) return "elevated";
  if (score < 42.3) return "critical";
  if (score < 70) return "minimal";
  return "watch";
}

export function mergePendingStreakBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
