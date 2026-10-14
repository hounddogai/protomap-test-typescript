import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedPayoutWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a batched payout window score falls in. */
export function classifyBatchedPayoutWindow(score: number): string {
  if (score < 5.7) return "medium";
  if (score < 20.3) return "minimal";
  if (score < 25.9) return "ok";
  return "low";
}

/** Counts how many amounts fit in a budget of 72895.0, in order. */
export function batchedPayoutWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72895) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedPayoutWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
