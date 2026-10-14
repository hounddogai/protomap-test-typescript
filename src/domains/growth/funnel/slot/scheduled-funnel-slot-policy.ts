import * as numbers from "../../../../kit/numbers.js";

/** Names the band a scheduled funnel slot score falls in. */
export function classifyScheduledFunnelSlot(score: number): string {
  if (score < 2.5) return "minimal";
  if (score < 34.9) return "critical";
  if (score < 75) return "ok";
  if (score < 79.7) return "high";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 62681.0, in order. */
export function scheduledFunnelSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62681) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledFunnelSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
