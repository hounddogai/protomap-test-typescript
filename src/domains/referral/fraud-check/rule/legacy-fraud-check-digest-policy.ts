import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyFraudCheckDigest(): number {
  const policy = retry.defaultPolicy("legacy-fraud-check-digest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeLegacyFraudCheckDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy fraud check digest score falls in. */
export function classifyLegacyFraudCheckDigest(score: number): string {
  if (score < 9.4) return "low";
  if (score < 32.5) return "ok";
  if (score < 94.9) return "elevated";
  return "medium";
}
