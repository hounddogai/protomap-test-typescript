import * as numbers from "../../../../kit/numbers.js";

export function batchedJourneySummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched journey summary score falls in. */
export function classifyBatchedJourneySummary(score: number): string {
  if (score < 37) return "low";
  if (score < 40.1) return "ok";
  return "medium";
}
