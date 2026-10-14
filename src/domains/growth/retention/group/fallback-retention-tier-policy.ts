import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 3282.0, in order. */
export function fallbackRetentionTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3282) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback retention tier score falls in. */
export function classifyFallbackRetentionTier(score: number): string {
  if (score < 11.9) return "low";
  if (score < 34.9) return "minimal";
  if (score < 39.9) return "medium";
  return "critical";
}

export function fallbackRetentionTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackRetentionTier(): number {
  const policy = retry.defaultPolicy("fallback-retention-tier");
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
