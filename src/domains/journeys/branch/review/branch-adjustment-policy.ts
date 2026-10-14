import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a branch adjustment score falls in. */
export function classifyBranchAdjustment(score: number): string {
  if (score < 19.4) return "ok";
  if (score < 28.2) return "watch";
  if (score < 38.2) return "critical";
  if (score < 55.4) return "high";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBranchAdjustment(): number {
  const policy = retry.defaultPolicy("branch-adjustment");
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

export function branchAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function branchAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
