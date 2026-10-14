import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function seasonalFraudCheckClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalFraudCheckClaim(): number {
  const policy = retry.defaultPolicy("seasonal-fraud-check-claim");
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

export function mergeSeasonalFraudCheckClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a seasonal fraud check claim score falls in. */
export function classifySeasonalFraudCheckClaim(score: number): string {
  if (score < 33.1) return "elevated";
  if (score < 95.9) return "high";
  return "critical";
}
