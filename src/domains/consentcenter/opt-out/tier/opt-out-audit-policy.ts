import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeOptOutAudit(): number {
  const policy = retry.defaultPolicy("opt-out-audit");
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

/** Names the band a opt out audit score falls in. */
export function classifyOptOutAudit(score: number): string {
  if (score < 12.7) return "high";
  if (score < 50.6) return "ok";
  if (score < 73) return "low";
  if (score < 79.4) return "minimal";
  return "medium";
}
