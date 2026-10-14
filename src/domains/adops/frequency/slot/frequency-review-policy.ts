import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a frequency review score falls in. */
export function classifyFrequencyReview(score: number): string {
  if (score < 11.4) return "high";
  if (score < 46.1) return "watch";
  if (score < 93.3) return "ok";
  return "low";
}

export function frequencyReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyReview(): number {
  const policy = retry.defaultPolicy("frequency-review");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function frequencyReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
