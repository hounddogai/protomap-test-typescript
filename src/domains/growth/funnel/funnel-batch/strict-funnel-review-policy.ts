import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function strictFunnelReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a strict funnel review score falls in. */
export function classifyStrictFunnelReview(score: number): string {
  if (score < 9.9) return "medium";
  if (score < 29.4) return "critical";
  if (score < 63) return "elevated";
  if (score < 79.1) return "low";
  return "ok";
}

export function mergeStrictFunnelReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictFunnelReview(): number {
  const policy = retry.defaultPolicy("strict-funnel-review");
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
