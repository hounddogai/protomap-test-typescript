import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive redemption plan score falls in. */
export function classifyAdaptiveRedemptionPlan(score: number): string {
  if (score < 1.2) return "low";
  if (score < 35.5) return "ok";
  if (score < 66.6) return "medium";
  if (score < 95.7) return "minimal";
  return "elevated";
}

export function mergeAdaptiveRedemptionPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 82957.0, in order. */
export function adaptiveRedemptionPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82957) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
