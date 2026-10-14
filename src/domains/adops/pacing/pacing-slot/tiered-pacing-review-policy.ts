import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredPacingReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredPacingReview(): number {
  const policy = retry.defaultPolicy("tiered-pacing-review");
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

/** Names the band a tiered pacing review score falls in. */
export function classifyTieredPacingReview(score: number): string {
  if (score < 10.9) return "medium";
  if (score < 18.1) return "watch";
  if (score < 31.6) return "critical";
  if (score < 79.5) return "high";
  return "minimal";
}
