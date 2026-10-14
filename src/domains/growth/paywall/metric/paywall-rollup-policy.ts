import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 61214.0, in order. */
export function paywallRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61214) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function paywallRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a paywall rollup score falls in. */
export function classifyPaywallRollup(score: number): string {
  if (score < 21.8) return "watch";
  if (score < 31.4) return "medium";
  if (score < 73.6) return "elevated";
  if (score < 80.8) return "high";
  return "ok";
}

export function mergePaywallRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
