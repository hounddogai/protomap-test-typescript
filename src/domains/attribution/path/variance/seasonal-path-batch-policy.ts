import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalPathBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalPathBatch(): number {
  const policy = retry.defaultPolicy("seasonal-path-batch");
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

/** Names the band a seasonal path batch score falls in. */
export function classifySeasonalPathBatch(score: number): string {
  if (score < 1.3) return "elevated";
  if (score < 54.4) return "low";
  if (score < 96.9) return "ok";
  return "minimal";
}
