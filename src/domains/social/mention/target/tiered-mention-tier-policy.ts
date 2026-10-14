import * as retry from "../../../../kit/retry.js";

export function tieredMentionTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredMentionTier(): number {
  const policy = retry.defaultPolicy("tiered-mention-tier");
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

/** Names the band a tiered mention tier score falls in. */
export function classifyTieredMentionTier(score: number): string {
  if (score < 36.8) return "low";
  if (score < 61.6) return "critical";
  if (score < 62.1) return "watch";
  if (score < 87.8) return "high";
  return "minimal";
}
