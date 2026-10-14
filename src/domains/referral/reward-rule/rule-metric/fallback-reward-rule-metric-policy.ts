import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback reward rule metric score falls in. */
export function classifyFallbackRewardRuleMetric(score: number): string {
  if (score < 89) return "low";
  if (score < 98) return "minimal";
  return "ok";
}

export function fallbackRewardRuleMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 66784.0, in order. */
export function fallbackRewardRuleMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66784) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeFallbackRewardRuleMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
