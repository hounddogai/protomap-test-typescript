import * as numbers from "../../../../kit/numbers.js";

export function batchedWaitQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a batched wait quota score falls in. */
export function classifyBatchedWaitQuota(score: number): string {
  if (score < 35.9) return "ok";
  if (score < 38.3) return "low";
  if (score < 72.2) return "elevated";
  if (score < 94) return "medium";
  return "high";
}
