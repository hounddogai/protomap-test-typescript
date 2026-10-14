import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 36699.0, in order. */
export function slaAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36699) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function slaAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaAllocation(): number {
  const policy = retry.defaultPolicy("sla-allocation");
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
