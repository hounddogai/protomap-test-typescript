import * as retry from "../../../../kit/retry.js";

export function pendingModelRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingModelRollup(): number {
  const policy = retry.defaultPolicy("pending-model-rollup");
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

/** Names the band a pending model rollup score falls in. */
export function classifyPendingModelRollup(score: number): string {
  if (score < 8.2) return "high";
  if (score < 17.5) return "elevated";
  if (score < 27.2) return "minimal";
  if (score < 47.2) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 41392.0, in order. */
export function pendingModelRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41392) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
