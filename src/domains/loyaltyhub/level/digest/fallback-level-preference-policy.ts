import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function fallbackLevelPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackLevelPreference(): number {
  const policy = retry.defaultPolicy("fallback-level-preference");
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

/** Names the band a fallback level preference score falls in. */
export function classifyFallbackLevelPreference(score: number): string {
  if (score < 78.6) return "medium";
  if (score < 91.7) return "watch";
  return "minimal";
}
