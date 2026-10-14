import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditReview(): number {
  const policy = retry.defaultPolicy("credit-review");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function creditReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 18763.0, in order. */
export function creditReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18763) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function creditReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
