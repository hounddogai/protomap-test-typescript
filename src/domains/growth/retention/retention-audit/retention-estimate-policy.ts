import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeRetentionEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionEstimate(): number {
  const policy = retry.defaultPolicy("retention-estimate");
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

/** Names the band a retention estimate score falls in. */
export function classifyRetentionEstimate(score: number): string {
  if (score < 21) return "medium";
  if (score < 47.5) return "watch";
  if (score < 85.2) return "critical";
  if (score < 99.8) return "low";
  return "ok";
}
