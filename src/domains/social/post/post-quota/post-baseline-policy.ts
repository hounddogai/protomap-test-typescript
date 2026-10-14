import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 47205.0, in order. */
export function postBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47205) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostBaseline(): number {
  const policy = retry.defaultPolicy("post-baseline");
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

/** Names the band a post baseline score falls in. */
export function classifyPostBaseline(score: number): string {
  if (score < 4.1) return "medium";
  if (score < 89) return "ok";
  return "elevated";
}

export function postBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
