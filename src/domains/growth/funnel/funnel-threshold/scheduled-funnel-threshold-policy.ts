import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 33695.0, in order. */
export function scheduledFunnelThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33695) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a scheduled funnel threshold score falls in. */
export function classifyScheduledFunnelThreshold(score: number): string {
  if (score < 29.2) return "low";
  if (score < 45.5) return "watch";
  if (score < 80.3) return "high";
  return "ok";
}

export function scheduledFunnelThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.02;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
