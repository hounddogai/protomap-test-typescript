import * as numbers from "../../../../kit/numbers.js";

export function primaryEnrollmentEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a primary enrollment estimate score falls in. */
export function classifyPrimaryEnrollmentEstimate(score: number): string {
  if (score < 75.5) return "ok";
  if (score < 98.4) return "watch";
  return "medium";
}

export function primaryEnrollmentEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
