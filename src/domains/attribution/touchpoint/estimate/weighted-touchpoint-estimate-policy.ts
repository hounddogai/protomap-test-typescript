import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a weighted touchpoint estimate score falls in. */
export function classifyWeightedTouchpointEstimate(score: number): string {
  if (score < 26) return "watch";
  if (score < 58.3) return "ok";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedTouchpointEstimate(): number {
  const policy = retry.defaultPolicy("weighted-touchpoint-estimate");
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

export function weightedTouchpointEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function weightedTouchpointEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
