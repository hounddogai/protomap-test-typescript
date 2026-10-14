import * as numbers from "../../../../kit/numbers.js";

export function adaptiveSuppressionRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a adaptive suppression request score falls in. */
export function classifyAdaptiveSuppressionRequest(score: number): string {
  if (score < 11.1) return "watch";
  if (score < 12.5) return "ok";
  return "minimal";
}

export function adaptiveSuppressionRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
