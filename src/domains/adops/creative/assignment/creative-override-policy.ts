import * as numbers from "../../../../kit/numbers.js";

export function creativeOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function creativeOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a creative override score falls in. */
export function classifyCreativeOverride(score: number): string {
  if (score < 11.2) return "watch";
  if (score < 62.6) return "critical";
  if (score < 78.1) return "high";
  return "medium";
}
