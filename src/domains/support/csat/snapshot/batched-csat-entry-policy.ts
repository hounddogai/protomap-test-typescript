import * as numbers from "../../../../kit/numbers.js";

export function batchedCsatEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched csat entry score falls in. */
export function classifyBatchedCsatEntry(score: number): string {
  if (score < 5.9) return "low";
  if (score < 45.3) return "minimal";
  if (score < 60.1) return "critical";
  if (score < 88.6) return "elevated";
  return "medium";
}

export function batchedCsatEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
