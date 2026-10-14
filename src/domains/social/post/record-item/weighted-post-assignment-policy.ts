import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedPostAssignment(): number {
  const policy = retry.defaultPolicy("weighted-post-assignment");
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

/** Counts how many amounts fit in a budget of 51868.0, in order. */
export function weightedPostAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51868) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted post assignment score falls in. */
export function classifyWeightedPostAssignment(score: number): string {
  if (score < 31.2) return "high";
  if (score < 73.8) return "low";
  return "critical";
}
