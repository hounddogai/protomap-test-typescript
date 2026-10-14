import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback preference rollup score falls in. */
export function classifyFallbackPreferenceRollup(score: number): string {
  if (score < 34.8) return "low";
  if (score < 87.6) return "ok";
  return "watch";
}

export function fallbackPreferenceRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackPreferenceRollup(): number {
  const policy = retry.defaultPolicy("fallback-preference-rollup");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
