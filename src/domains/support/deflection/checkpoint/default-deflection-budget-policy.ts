import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function defaultDeflectionBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a default deflection budget score falls in. */
export function classifyDefaultDeflectionBudget(score: number): string {
  if (score < 12.2) return "critical";
  if (score < 45.8) return "watch";
  if (score < 64.1) return "minimal";
  if (score < 74.7) return "high";
  return "low";
}

export function mergeDefaultDeflectionBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function defaultDeflectionBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
