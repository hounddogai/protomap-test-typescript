import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 11511.0, in order. */
export function strictFrequencyReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11511) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictFrequencyReview(): number {
  const policy = retry.defaultPolicy("strict-frequency-review");
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

/** Names the band a strict frequency review score falls in. */
export function classifyStrictFrequencyReview(score: number): string {
  if (score < 8.3) return "high";
  if (score < 38.1) return "critical";
  return "ok";
}
