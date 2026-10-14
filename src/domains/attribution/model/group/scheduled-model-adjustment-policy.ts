import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function scheduledModelAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledModelAdjustment(): number {
  const policy = retry.defaultPolicy("scheduled-model-adjustment");
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
