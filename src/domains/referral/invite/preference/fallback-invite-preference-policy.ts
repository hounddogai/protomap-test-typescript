import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackInvitePreference(): number {
  const policy = retry.defaultPolicy("fallback-invite-preference");
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

/** Names the band a fallback invite preference score falls in. */
export function classifyFallbackInvitePreference(score: number): string {
  if (score < 18.2) return "elevated";
  if (score < 25.4) return "low";
  return "medium";
}

export function fallbackInvitePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
