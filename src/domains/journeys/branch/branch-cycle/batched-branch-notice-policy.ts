import * as numbers from "../../../../kit/numbers.js";

export function batchedBranchNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a batched branch notice score falls in. */
export function classifyBatchedBranchNotice(score: number): string {
  if (score < 26.1) return "high";
  if (score < 56) return "critical";
  if (score < 90.9) return "medium";
  if (score < 95.7) return "minimal";
  return "low";
}
