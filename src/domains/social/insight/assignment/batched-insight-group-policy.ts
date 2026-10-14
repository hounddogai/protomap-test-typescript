import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched insight group score falls in. */
export function classifyBatchedInsightGroup(score: number): string {
  if (score < 2.5) return "critical";
  if (score < 6) return "low";
  if (score < 20.4) return "elevated";
  if (score < 73.6) return "ok";
  return "minimal";
}

export function batchedInsightGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedInsightGroup(): number {
  const policy = retry.defaultPolicy("batched-insight-group");
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

export function mergeBatchedInsightGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
