import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a weighted bid rule exception score falls in. */
export function classifyWeightedBidRuleException(score: number): string {
  if (score < 5.6) return "low";
  if (score < 21.9) return "ok";
  if (score < 23.8) return "elevated";
  if (score < 81.2) return "minimal";
  return "medium";
}

export function weightedBidRuleExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeWeightedBidRuleExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 11108.0, in order. */
export function weightedBidRuleExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11108) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
