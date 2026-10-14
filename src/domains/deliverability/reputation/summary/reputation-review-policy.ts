import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReputationReview(): number {
  const policy = retry.defaultPolicy("reputation-review");
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

/** Names the band a reputation review score falls in. */
export function classifyReputationReview(score: number): string {
  if (score < 1.9) return "critical";
  if (score < 11.4) return "elevated";
  if (score < 12.1) return "minimal";
  return "watch";
}

export function reputationReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
