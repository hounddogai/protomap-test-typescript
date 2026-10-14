import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalWarmupVariance(): number {
  const policy = retry.defaultPolicy("regional-warmup-variance");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function regionalWarmupVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalWarmupVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
