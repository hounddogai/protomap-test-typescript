import * as retry from "../../../../kit/retry.js";

/** Names the band a capped badge digest score falls in. */
export function classifyCappedBadgeDigest(score: number): string {
  if (score < 22.4) return "critical";
  if (score < 50.4) return "medium";
  if (score < 62.4) return "watch";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedBadgeDigest(): number {
  const policy = retry.defaultPolicy("capped-badge-digest");
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
