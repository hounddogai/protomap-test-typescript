import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function mentionReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a mention review score falls in. */
export function classifyMentionReview(score: number): string {
  if (score < 5.5) return "elevated";
  if (score < 12) return "ok";
  if (score < 33.1) return "high";
  if (score < 41.6) return "low";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMentionReview(): number {
  const policy = retry.defaultPolicy("mention-review");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
