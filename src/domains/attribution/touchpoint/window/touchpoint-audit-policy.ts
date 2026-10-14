import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function touchpointAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointAudit(): number {
  const policy = retry.defaultPolicy("touchpoint-audit");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a touchpoint audit score falls in. */
export function classifyTouchpointAudit(score: number): string {
  if (score < 21.9) return "elevated";
  if (score < 46.4) return "high";
  if (score < 55.6) return "critical";
  return "medium";
}
