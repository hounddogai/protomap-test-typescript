import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 79151.0, in order. */
export function rollingExitRuleReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79151) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a rolling exit rule review score falls in. */
export function classifyRollingExitRuleReview(score: number): string {
  if (score < 51.2) return "high";
  if (score < 77.1) return "ok";
  if (score < 78.4) return "watch";
  return "elevated";
}

export function rollingExitRuleReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingExitRuleReview(): number {
  const policy = retry.defaultPolicy("rolling-exit-rule-review");
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
