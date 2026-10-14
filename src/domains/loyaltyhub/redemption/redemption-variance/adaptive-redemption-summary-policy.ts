import * as numbers from "../../../../kit/numbers.js";

export function adaptiveRedemptionSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveRedemptionSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a adaptive redemption summary score falls in. */
export function classifyAdaptiveRedemptionSummary(score: number): string {
  if (score < 1.8) return "high";
  if (score < 50.8) return "ok";
  if (score < 82.5) return "elevated";
  return "minimal";
}
