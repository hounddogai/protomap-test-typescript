import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalPlacementAllocation(): number {
  const policy = retry.defaultPolicy("regional-placement-allocation");
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

export function regionalPlacementAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function regionalPlacementAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function regionalPlacementAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
