import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function complaintScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function complaintScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintScore(): number {
  const policy = retry.defaultPolicy("complaint-score");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
