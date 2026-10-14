import * as numbers from "../../../../kit/numbers.js";

export function conversionThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function conversionThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a conversion threshold score falls in. */
export function classifyConversionThreshold(score: number): string {
  if (score < 77.8) return "elevated";
  if (score < 86.6) return "ok";
  return "medium";
}
