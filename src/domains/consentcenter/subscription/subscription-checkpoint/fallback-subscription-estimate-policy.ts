import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback subscription estimate score falls in. */
export function classifyFallbackSubscriptionEstimate(score: number): string {
  if (score < 8.5) return "minimal";
  if (score < 38.2) return "critical";
  if (score < 45.2) return "watch";
  if (score < 67.9) return "low";
  return "ok";
}

/** Counts how many amounts fit in a budget of 6552.0, in order. */
export function fallbackSubscriptionEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6552) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeFallbackSubscriptionEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
