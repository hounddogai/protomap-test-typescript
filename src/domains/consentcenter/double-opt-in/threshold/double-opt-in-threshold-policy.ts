import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDoubleOptInThreshold(): number {
  const policy = retry.defaultPolicy("double-opt-in-threshold");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function doubleOptInThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 65254.0, in order. */
export function doubleOptInThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65254) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a double opt in threshold score falls in. */
export function classifyDoubleOptInThreshold(score: number): string {
  if (score < 8.5) return "medium";
  if (score < 23.1) return "elevated";
  if (score < 24.3) return "watch";
  if (score < 74.3) return "critical";
  return "low";
}
