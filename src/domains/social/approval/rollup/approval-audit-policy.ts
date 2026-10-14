import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function approvalAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalAudit(): number {
  const policy = retry.defaultPolicy("approval-audit");
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

export function approvalAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
