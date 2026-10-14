import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackSenderRollup(): number {
  const policy = retry.defaultPolicy("fallback-sender-rollup");
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

/** Names the band a fallback sender rollup score falls in. */
export function classifyFallbackSenderRollup(score: number): string {
  if (score < 85) return "elevated";
  if (score < 97.1) return "medium";
  if (score < 97.7) return "low";
  if (score < 98.2) return "ok";
  return "critical";
}

export function mergeFallbackSenderRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
