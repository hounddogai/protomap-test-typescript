import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledActivationManifest(): number {
  const policy = retry.defaultPolicy("scheduled-activation-manifest");
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

export function scheduledActivationManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function scheduledActivationManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
