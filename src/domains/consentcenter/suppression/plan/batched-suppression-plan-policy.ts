import * as numbers from "../../../../kit/numbers.js";

export function batchedSuppressionPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function batchedSuppressionPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched suppression plan score falls in. */
export function classifyBatchedSuppressionPlan(score: number): string {
  if (score < 27.1) return "medium";
  if (score < 68.5) return "high";
  if (score < 74.3) return "critical";
  if (score < 92.5) return "watch";
  return "low";
}

export function batchedSuppressionPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
