import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a csat estimate score falls in. */
export function classifyCsatEstimate(score: number): string {
  if (score < 24.5) return "high";
  if (score < 54.5) return "ok";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCsatEstimate(): number {
  const policy = retry.defaultPolicy("csat-estimate");
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

export function csatEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function csatEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
