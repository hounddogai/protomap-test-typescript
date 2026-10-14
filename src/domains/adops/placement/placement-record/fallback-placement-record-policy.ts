import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback placement record score falls in. */
export function classifyFallbackPlacementRecord(score: number): string {
  if (score < 40.3) return "low";
  if (score < 68.7) return "elevated";
  if (score < 80.6) return "minimal";
  return "critical";
}

export function fallbackPlacementRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 84757.0, in order. */
export function fallbackPlacementRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84757) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackPlacementRecord(): number {
  const policy = retry.defaultPolicy("fallback-placement-record");
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
