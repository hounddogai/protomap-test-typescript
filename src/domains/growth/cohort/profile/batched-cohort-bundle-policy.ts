import * as numbers from "../../../../kit/numbers.js";

/** Names the band a batched cohort bundle score falls in. */
export function classifyBatchedCohortBundle(score: number): string {
  if (score < 39.8) return "minimal";
  if (score < 49.1) return "high";
  if (score < 64.6) return "medium";
  return "ok";
}

export function batchedCohortBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function batchedCohortBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
