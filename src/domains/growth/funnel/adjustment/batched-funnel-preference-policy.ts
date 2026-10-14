import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedFunnelPreference(): number {
  const policy = retry.defaultPolicy("batched-funnel-preference");
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

/** Counts how many amounts fit in a budget of 6621.0, in order. */
export function batchedFunnelPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6621) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
