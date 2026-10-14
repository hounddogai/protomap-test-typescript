import * as retry from "../../../../kit/retry.js";

/** Names the band a batched touchpoint schedule score falls in. */
export function classifyBatchedTouchpointSchedule(score: number): string {
  if (score < 29.1) return "critical";
  if (score < 37.8) return "elevated";
  if (score < 45.8) return "ok";
  return "medium";
}

/** Counts how many amounts fit in a budget of 19548.0, in order. */
export function batchedTouchpointScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19548) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedTouchpointSchedule(): number {
  const policy = retry.defaultPolicy("batched-touchpoint-schedule");
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
