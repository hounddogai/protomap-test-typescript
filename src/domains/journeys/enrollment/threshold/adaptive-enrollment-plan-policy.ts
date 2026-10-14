import * as numbers from "../../../../kit/numbers.js";

export function adaptiveEnrollmentPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a adaptive enrollment plan score falls in. */
export function classifyAdaptiveEnrollmentPlan(score: number): string {
  if (score < 4.7) return "minimal";
  if (score < 63.4) return "high";
  if (score < 73.6) return "low";
  if (score < 86.2) return "elevated";
  return "medium";
}

/** Counts how many amounts fit in a budget of 93050.0, in order. */
export function adaptiveEnrollmentPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93050) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
