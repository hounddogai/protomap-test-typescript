import * as numbers from "../../../../kit/numbers.js";

export function tieredTouchpointOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered touchpoint override score falls in. */
export function classifyTieredTouchpointOverride(score: number): string {
  if (score < 15.9) return "ok";
  if (score < 49.5) return "watch";
  if (score < 75.6) return "minimal";
  return "medium";
}

export function tieredTouchpointOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
