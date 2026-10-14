import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a weighted activation allocation score falls in. */
export function classifyWeightedActivationAllocation(score: number): string {
  if (score < 15.6) return "high";
  if (score < 18.7) return "minimal";
  if (score < 88.9) return "elevated";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedActivationAllocation(): number {
  const policy = retry.defaultPolicy("weighted-activation-allocation");
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

export function weightedActivationAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
