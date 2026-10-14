import * as retry from "../../../../kit/retry.js";

/** Names the band a manual retention quota score falls in. */
export function classifyManualRetentionQuota(score: number): string {
  if (score < 33.9) return "elevated";
  if (score < 50) return "watch";
  if (score < 56.1) return "high";
  if (score < 64) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualRetentionQuota(): number {
  const policy = retry.defaultPolicy("manual-retention-quota");
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
