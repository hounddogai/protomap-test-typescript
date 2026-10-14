import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSubscriptionAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a subscription allocation score falls in. */
export function classifySubscriptionAllocation(score: number): string {
  if (score < 21) return "critical";
  if (score < 45.9) return "medium";
  if (score < 63.6) return "high";
  if (score < 75.7) return "low";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 96402.0, in order. */
export function subscriptionAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96402) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
