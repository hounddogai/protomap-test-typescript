import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function postSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function postSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a post snapshot score falls in. */
export function classifyPostSnapshot(score: number): string {
  if (score < 30) return "critical";
  if (score < 46.9) return "medium";
  if (score < 84.4) return "minimal";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostSnapshot(): number {
  const policy = retry.defaultPolicy("post-snapshot");
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
