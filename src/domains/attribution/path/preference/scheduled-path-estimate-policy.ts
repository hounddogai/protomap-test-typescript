import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledPathEstimate(): number {
  const policy = retry.defaultPolicy("scheduled-path-estimate");
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

export function scheduledPathEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
