import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function frequencyRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function frequencyRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyRecord(): number {
  const policy = retry.defaultPolicy("frequency-record");
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

/** Names the band a frequency record score falls in. */
export function classifyFrequencyRecord(score: number): string {
  if (score < 4) return "ok";
  if (score < 36.4) return "elevated";
  if (score < 55.8) return "watch";
  if (score < 98) return "low";
  return "minimal";
}
