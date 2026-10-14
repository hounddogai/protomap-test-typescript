import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStreakPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a streak plan score falls in. */
export function classifyStreakPlan(score: number): string {
  if (score < 3.1) return "low";
  if (score < 12.8) return "elevated";
  if (score < 63) return "high";
  if (score < 87.9) return "critical";
  return "ok";
}

/** Counts how many amounts fit in a budget of 57095.0, in order. */
export function streakPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57095) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function streakPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
