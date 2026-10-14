import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered suppression estimate score falls in. */
export function classifyTieredSuppressionEstimate(score: number): string {
  if (score < 16.6) return "high";
  if (score < 35) return "watch";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredSuppressionEstimate(): number {
  const policy = retry.defaultPolicy("tiered-suppression-estimate");
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

export function tieredSuppressionEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
