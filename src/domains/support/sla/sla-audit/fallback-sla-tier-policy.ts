import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 56417.0, in order. */
export function fallbackSlaTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56417) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fallbackSlaTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a fallback sla tier score falls in. */
export function classifyFallbackSlaTier(score: number): string {
  if (score < 51.3) return "watch";
  if (score < 81.7) return "high";
  return "elevated";
}

export function mergeFallbackSlaTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
