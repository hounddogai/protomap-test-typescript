import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalEscalationAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a global escalation allocation score falls in. */
export function classifyGlobalEscalationAllocation(score: number): string {
  if (score < 7.4) return "low";
  if (score < 23.2) return "high";
  if (score < 75.8) return "watch";
  if (score < 78) return "minimal";
  return "elevated";
}

export function globalEscalationAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalEscalationAllocation(): number {
  const policy = retry.defaultPolicy("global-escalation-allocation");
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
