import * as retry from "../../../../kit/retry.js";

/** Names the band a manual domain record score falls in. */
export function classifyManualDomainRecord(score: number): string {
  if (score < 39) return "critical";
  if (score < 39.4) return "medium";
  if (score < 42.2) return "elevated";
  if (score < 59.9) return "low";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualDomainRecord(): number {
  const policy = retry.defaultPolicy("manual-domain-record");
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
