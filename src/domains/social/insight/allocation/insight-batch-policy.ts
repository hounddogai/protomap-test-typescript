import * as numbers from "../../../../kit/numbers.js";

export function insightBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function insightBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a insight batch score falls in. */
export function classifyInsightBatch(score: number): string {
  if (score < 2.9) return "critical";
  if (score < 21.4) return "elevated";
  if (score < 85.9) return "low";
  if (score < 90.7) return "high";
  return "watch";
}
