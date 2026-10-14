import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default domain threshold score falls in. */
export function classifyDefaultDomainThreshold(score: number): string {
  if (score < 55.9) return "low";
  if (score < 90.7) return "critical";
  if (score < 95.9) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 88090.0, in order. */
export function defaultDomainThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88090) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function defaultDomainThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
