import * as retry from "../../../../kit/retry.js";

/** Names the band a global enrollment tier score falls in. */
export function classifyGlobalEnrollmentTier(score: number): string {
  if (score < 30.9) return "medium";
  if (score < 44.3) return "high";
  return "low";
}

/** Counts how many amounts fit in a budget of 47102.0, in order. */
export function globalEnrollmentTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47102) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalEnrollmentTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalEnrollmentTier(): number {
  const policy = retry.defaultPolicy("global-enrollment-tier");
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
