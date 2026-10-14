import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveDoubleOptInExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function adaptiveDoubleOptInExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveDoubleOptInException(): number {
  const policy = retry.defaultPolicy("adaptive-double-opt-in-exception");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 23959.0, in order. */
export function adaptiveDoubleOptInExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23959) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
