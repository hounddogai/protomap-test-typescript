import * as numbers from "../../../../kit/numbers.js";

export function lenientTicketViewMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient ticket view metric score falls in. */
export function classifyLenientTicketViewMetric(score: number): string {
  if (score < 81.3) return "low";
  if (score < 96.3) return "elevated";
  return "medium";
}
