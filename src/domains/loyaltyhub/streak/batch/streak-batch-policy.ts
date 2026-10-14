import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a streak batch score falls in. */
export function classifyStreakBatch(score: number): string {
  if (score < 3.1) return "critical";
  if (score < 51.6) return "ok";
  if (score < 78.3) return "high";
  if (score < 81.5) return "low";
  return "minimal";
}

export function streakBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakBatch(): number {
  const policy = retry.defaultPolicy("streak-batch");
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
