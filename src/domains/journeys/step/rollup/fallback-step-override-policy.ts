import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback step override score falls in. */
export function classifyFallbackStepOverride(score: number): string {
  if (score < 33) return "low";
  if (score < 85.9) return "watch";
  return "minimal";
}

export function fallbackStepOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function fallbackStepOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
