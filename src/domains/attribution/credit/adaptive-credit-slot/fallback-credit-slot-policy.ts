import * as retry from "../../../../kit/retry.js";

export function fallbackCreditSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 14174.0, in order. */
export function fallbackCreditSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14174) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackCreditSlot(): number {
  const policy = retry.defaultPolicy("fallback-credit-slot");
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
