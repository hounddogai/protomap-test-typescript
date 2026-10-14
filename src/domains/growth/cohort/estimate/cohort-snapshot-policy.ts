import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortSnapshot(): number {
  const policy = retry.defaultPolicy("cohort-snapshot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function cohortSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a cohort snapshot score falls in. */
export function classifyCohortSnapshot(score: number): string {
  if (score < 9.5) return "watch";
  if (score < 61.2) return "elevated";
  if (score < 89.9) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 43780.0, in order. */
export function cohortSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43780) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
