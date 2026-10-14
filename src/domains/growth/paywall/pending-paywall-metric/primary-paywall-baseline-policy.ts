import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 18810.0, in order. */
export function primaryPaywallBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18810) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryPaywallBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryPaywallBaseline(): number {
  const policy = retry.defaultPolicy("primary-paywall-baseline");
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
