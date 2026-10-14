import * as retry from "../../../../kit/retry.js";

/** Names the band a pending badge audit score falls in. */
export function classifyPendingBadgeAudit(score: number): string {
  if (score < 39.8) return "ok";
  if (score < 82.1) return "elevated";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingBadgeAudit(): number {
  const policy = retry.defaultPolicy("pending-badge-audit");
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
