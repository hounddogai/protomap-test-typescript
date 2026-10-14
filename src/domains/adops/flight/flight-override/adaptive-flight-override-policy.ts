import * as numbers from "../../../../kit/numbers.js";

export function adaptiveFlightOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a adaptive flight override score falls in. */
export function classifyAdaptiveFlightOverride(score: number): string {
  if (score < 2.1) return "high";
  if (score < 5.6) return "medium";
  if (score < 34.4) return "ok";
  return "critical";
}

export function adaptiveFlightOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveFlightOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
