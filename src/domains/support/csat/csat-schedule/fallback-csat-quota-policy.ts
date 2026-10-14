import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback csat quota score falls in. */
export function classifyFallbackCsatQuota(score: number): string {
  if (score < 89.8) return "watch";
  if (score < 92.7) return "ok";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackCsatQuota(): number {
  const policy = retry.defaultPolicy("fallback-csat-quota");
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
