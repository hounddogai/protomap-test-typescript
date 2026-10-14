import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackBidRulePreference(): number {
  const policy = retry.defaultPolicy("fallback-bid-rule-preference");
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

/** Names the band a fallback bid rule preference score falls in. */
export function classifyFallbackBidRulePreference(score: number): string {
  if (score < 13.8) return "low";
  if (score < 72.9) return "critical";
  if (score < 99.8) return "elevated";
  return "ok";
}
