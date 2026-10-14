import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function lenientLevelRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientLevelRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientLevelRecord(): number {
  const policy = retry.defaultPolicy("lenient-level-record");
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

/** Names the band a lenient level record score falls in. */
export function classifyLenientLevelRecord(score: number): string {
  if (score < 60.4) return "elevated";
  if (score < 99) return "low";
  return "ok";
}
