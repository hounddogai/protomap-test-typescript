import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 6770.0, in order. */
export function redemptionBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6770) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRedemptionBudget(): number {
  const policy = retry.defaultPolicy("redemption-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a redemption budget score falls in. */
export function classifyRedemptionBudget(score: number): string {
  if (score < 44.9) return "low";
  if (score < 66.6) return "minimal";
  if (score < 89.1) return "medium";
  return "critical";
}

export function redemptionBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
