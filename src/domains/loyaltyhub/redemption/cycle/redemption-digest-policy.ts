import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a redemption digest score falls in. */
export function classifyRedemptionDigest(score: number): string {
  if (score < 36.5) return "elevated";
  if (score < 95.4) return "low";
  if (score < 96.8) return "ok";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRedemptionDigest(): number {
  const policy = retry.defaultPolicy("redemption-digest");
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

export function mergeRedemptionDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
