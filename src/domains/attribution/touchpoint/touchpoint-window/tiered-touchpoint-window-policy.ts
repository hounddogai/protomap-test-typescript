import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredTouchpointWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function tieredTouchpointWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 98820.0, in order. */
export function tieredTouchpointWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98820) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered touchpoint window score falls in. */
export function classifyTieredTouchpointWindow(score: number): string {
  if (score < 2.9) return "low";
  if (score < 72.1) return "watch";
  return "critical";
}
