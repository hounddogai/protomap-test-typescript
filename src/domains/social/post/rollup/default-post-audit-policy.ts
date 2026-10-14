import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultPostAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultPostAudit(): number {
  const policy = retry.defaultPolicy("default-post-audit");
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

export function defaultPostAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function defaultPostAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
