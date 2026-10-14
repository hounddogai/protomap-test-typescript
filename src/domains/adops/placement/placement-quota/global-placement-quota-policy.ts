import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalPlacementQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalPlacementQuota(): number {
  const policy = retry.defaultPolicy("global-placement-quota");
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

export function globalPlacementQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
