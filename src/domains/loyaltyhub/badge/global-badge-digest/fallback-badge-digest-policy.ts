import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 26965.0, in order. */
export function fallbackBadgeDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26965) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackBadgeDigest(): number {
  const policy = retry.defaultPolicy("fallback-badge-digest");
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

/** Names the band a fallback badge digest score falls in. */
export function classifyFallbackBadgeDigest(score: number): string {
  if (score < 24.4) return "medium";
  if (score < 69) return "low";
  return "watch";
}
