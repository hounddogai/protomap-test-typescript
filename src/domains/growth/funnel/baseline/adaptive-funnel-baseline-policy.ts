import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveFunnelBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 23403.0, in order. */
export function adaptiveFunnelBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23403) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveFunnelBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveFunnelBaseline(): number {
  const policy = retry.defaultPolicy("adaptive-funnel-baseline");
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
