import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a suppression batch score falls in. */
export function classifySuppressionBatch(score: number): string {
  if (score < 22.6) return "low";
  if (score < 50.7) return "high";
  if (score < 77.8) return "elevated";
  if (score < 87.8) return "minimal";
  return "critical";
}

export function mergeSuppressionBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSuppressionBatch(): number {
  const policy = retry.defaultPolicy("suppression-batch");
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

export function suppressionBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
