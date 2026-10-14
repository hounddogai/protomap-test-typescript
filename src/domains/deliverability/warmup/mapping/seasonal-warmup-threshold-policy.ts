import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalWarmupThreshold(): number {
  const policy = retry.defaultPolicy("seasonal-warmup-threshold");
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

/** Counts how many amounts fit in a budget of 85216.0, in order. */
export function seasonalWarmupThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85216) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
