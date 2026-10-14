import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyRetentionDigest(): number {
  const policy = retry.defaultPolicy("legacy-retention-digest");
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

/** Names the band a legacy retention digest score falls in. */
export function classifyLegacyRetentionDigest(score: number): string {
  if (score < 25.9) return "critical";
  if (score < 35) return "ok";
  if (score < 78.1) return "low";
  return "high";
}
