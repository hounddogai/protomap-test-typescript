import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function creditEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a credit estimate score falls in. */
export function classifyCreditEstimate(score: number): string {
  if (score < 14.8) return "minimal";
  if (score < 38.2) return "low";
  if (score < 85.8) return "high";
  return "elevated";
}

export function creditEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditEstimate(): number {
  const policy = retry.defaultPolicy("credit-estimate");
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
