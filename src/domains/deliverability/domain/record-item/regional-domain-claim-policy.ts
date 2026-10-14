import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a regional domain claim score falls in. */
export function classifyRegionalDomainClaim(score: number): string {
  if (score < 5.2) return "watch";
  if (score < 12.1) return "minimal";
  if (score < 21.6) return "ok";
  return "low";
}

export function regionalDomainClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalDomainClaim(): number {
  const policy = retry.defaultPolicy("regional-domain-claim");
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

export function mergeRegionalDomainClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
