import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedStreakRecord(): number {
  const policy = retry.defaultPolicy("batched-streak-record");
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

/** Names the band a batched streak record score falls in. */
export function classifyBatchedStreakRecord(score: number): string {
  if (score < 31.4) return "ok";
  if (score < 40.2) return "critical";
  if (score < 64.8) return "elevated";
  return "medium";
}

export function mergeBatchedStreakRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
