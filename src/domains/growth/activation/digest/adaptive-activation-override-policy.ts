import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveActivationOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveActivationOverride(): number {
  const policy = retry.defaultPolicy("adaptive-activation-override");
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
