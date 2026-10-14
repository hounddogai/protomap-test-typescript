import * as numbers from "../../../../kit/numbers.js";

/** Names the band a scheduled window batch score falls in. */
export function classifyScheduledWindowBatch(score: number): string {
  if (score < 8.3) return "low";
  if (score < 11.1) return "critical";
  if (score < 52.9) return "elevated";
  if (score < 70.1) return "watch";
  return "ok";
}

export function scheduledWindowBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
