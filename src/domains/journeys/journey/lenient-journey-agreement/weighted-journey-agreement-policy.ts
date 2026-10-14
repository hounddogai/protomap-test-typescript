import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted journey agreement score falls in. */
export function classifyWeightedJourneyAgreement(score: number): string {
  if (score < 41.6) return "watch";
  if (score < 65.4) return "elevated";
  if (score < 77.5) return "minimal";
  return "ok";
}

export function weightedJourneyAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function weightedJourneyAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
