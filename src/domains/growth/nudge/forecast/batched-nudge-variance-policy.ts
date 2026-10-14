import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedNudgeVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedNudgeVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a batched nudge variance score falls in. */
export function classifyBatchedNudgeVariance(score: number): string {
  if (score < 13.3) return "ok";
  if (score < 16.6) return "elevated";
  if (score < 39) return "minimal";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedNudgeVariance(): number {
  const policy = retry.defaultPolicy("batched-nudge-variance");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
