import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient payout segment score falls in. */
export function classifyLenientPayoutSegment(score: number): string {
  if (score < 19.1) return "ok";
  if (score < 60) return "medium";
  if (score < 78.4) return "critical";
  return "elevated";
}

export function lenientPayoutSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 60479.0, in order. */
export function lenientPayoutSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60479) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientPayoutSegment(): number {
  const policy = retry.defaultPolicy("lenient-payout-segment");
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
