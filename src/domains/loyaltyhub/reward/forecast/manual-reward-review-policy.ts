import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualRewardReview(): number {
  const policy = retry.defaultPolicy("manual-reward-review");
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

/** Counts how many amounts fit in a budget of 96678.0, in order. */
export function manualRewardReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96678) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual reward review score falls in. */
export function classifyManualRewardReview(score: number): string {
  if (score < 22.4) return "critical";
  if (score < 39.9) return "watch";
  if (score < 85.3) return "low";
  return "medium";
}

export function manualRewardReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
