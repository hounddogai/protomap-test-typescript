import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function bidRuleMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeBidRuleMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 72902.0, in order. */
export function bidRuleMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72902) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a bid rule metric score falls in. */
export function classifyBidRuleMetric(score: number): string {
  if (score < 23.7) return "critical";
  if (score < 59.8) return "high";
  return "ok";
}
