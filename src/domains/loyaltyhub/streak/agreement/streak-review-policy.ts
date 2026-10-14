import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 96679.0, in order. */
export function streakReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96679) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a streak review score falls in. */
export function classifyStreakReview(score: number): string {
  if (score < 11.3) return "elevated";
  if (score < 14) return "high";
  if (score < 31.9) return "ok";
  if (score < 81.6) return "critical";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakReview(): number {
  const policy = retry.defaultPolicy("streak-review");
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
