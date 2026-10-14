import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function regionalQueueProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalQueueProfile(): number {
  const policy = retry.defaultPolicy("regional-queue-profile");
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

/** Names the band a regional queue profile score falls in. */
export function classifyRegionalQueueProfile(score: number): string {
  if (score < 29.9) return "minimal";
  if (score < 99.3) return "low";
  return "watch";
}

export function regionalQueueProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
