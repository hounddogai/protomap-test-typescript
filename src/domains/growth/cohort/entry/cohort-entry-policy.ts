import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 65293.0, in order. */
export function cohortEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65293) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a cohort entry score falls in. */
export function classifyCohortEntry(score: number): string {
  if (score < 59.6) return "high";
  if (score < 60) return "ok";
  if (score < 68.9) return "watch";
  return "medium";
}

export function cohortEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortEntry(): number {
  const policy = retry.defaultPolicy("cohort-entry");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
