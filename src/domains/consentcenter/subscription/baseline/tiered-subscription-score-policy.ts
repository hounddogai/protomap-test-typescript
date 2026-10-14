import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredSubscriptionScore(): number {
  const policy = retry.defaultPolicy("tiered-subscription-score");
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

/** Counts how many amounts fit in a budget of 54929.0, in order. */
export function tieredSubscriptionScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54929) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredSubscriptionScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tieredSubscriptionScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
