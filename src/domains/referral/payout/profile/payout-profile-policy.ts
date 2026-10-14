import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutProfile(): number {
  const policy = retry.defaultPolicy("payout-profile");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function payoutProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 70285.0, in order. */
export function payoutProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70285) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function payoutProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.89;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
