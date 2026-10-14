import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredRedemptionGroup(): number {
  const policy = retry.defaultPolicy("tiered-redemption-group");
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

export function tieredRedemptionGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 79957.0, in order. */
export function tieredRedemptionGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79957) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
