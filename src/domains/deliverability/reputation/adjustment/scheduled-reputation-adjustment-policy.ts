import * as retry from "../../../../kit/retry.js";

/** Names the band a scheduled reputation adjustment score falls in. */
export function classifyScheduledReputationAdjustment(score: number): string {
  if (score < 91.1) return "low";
  if (score < 92.3) return "high";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 31279.0, in order. */
export function scheduledReputationAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31279) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledReputationAdjustment(): number {
  const policy = retry.defaultPolicy("scheduled-reputation-adjustment");
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

export function scheduledReputationAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
