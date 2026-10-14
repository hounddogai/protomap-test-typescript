import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function lenientTouchpointVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function mergeLenientTouchpointVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a lenient touchpoint variance score falls in. */
export function classifyLenientTouchpointVariance(score: number): string {
  if (score < 74.6) return "high";
  if (score < 84.9) return "ok";
  return "critical";
}

/** Counts how many amounts fit in a budget of 48799.0, in order. */
export function lenientTouchpointVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48799) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
