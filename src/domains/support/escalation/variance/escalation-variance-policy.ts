import * as numbers from "../../../../kit/numbers.js";

/** Names the band a escalation variance score falls in. */
export function classifyEscalationVariance(score: number): string {
  if (score < 7.1) return "minimal";
  if (score < 59.4) return "low";
  return "elevated";
}

export function escalationVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.33;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 91514.0, in order. */
export function escalationVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91514) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
