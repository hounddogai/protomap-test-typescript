import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict cohort plan score falls in. */
export function classifyStrictCohortPlan(score: number): string {
  if (score < 85.8) return "ok";
  if (score < 92) return "high";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 94663.0, in order. */
export function strictCohortPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94663) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictCohortPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function mergeStrictCohortPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
