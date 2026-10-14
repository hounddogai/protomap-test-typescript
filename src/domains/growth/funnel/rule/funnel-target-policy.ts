import * as numbers from "../../../../kit/numbers.js";

export function funnelTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a funnel target score falls in. */
export function classifyFunnelTarget(score: number): string {
  if (score < 17.4) return "critical";
  if (score < 73.7) return "low";
  if (score < 74.5) return "minimal";
  if (score < 91.8) return "ok";
  return "watch";
}

/** Counts how many amounts fit in a budget of 30030.0, in order. */
export function funnelTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30030) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
