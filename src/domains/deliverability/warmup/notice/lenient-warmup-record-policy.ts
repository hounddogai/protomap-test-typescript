import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function lenientWarmupRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient warmup record score falls in. */
export function classifyLenientWarmupRecord(score: number): string {
  if (score < 31.3) return "minimal";
  if (score < 44.7) return "watch";
  if (score < 87.3) return "elevated";
  return "low";
}

export function lenientWarmupRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientWarmupRecord(): number {
  const policy = retry.defaultPolicy("lenient-warmup-record");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
