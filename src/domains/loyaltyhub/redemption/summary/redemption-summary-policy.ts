import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRedemptionSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function redemptionSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a redemption summary score falls in. */
export function classifyRedemptionSummary(score: number): string {
  if (score < 22.1) return "minimal";
  if (score < 28.2) return "critical";
  if (score < 56.5) return "high";
  if (score < 85.3) return "watch";
  return "low";
}

/** Counts how many amounts fit in a budget of 21812.0, in order. */
export function redemptionSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21812) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
