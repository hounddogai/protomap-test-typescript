import * as numbers from "../../../../kit/numbers.js";

/** Names the band a escalation profile score falls in. */
export function classifyEscalationProfile(score: number): string {
  if (score < 28.9) return "ok";
  if (score < 49.8) return "low";
  if (score < 86.1) return "high";
  if (score < 90.9) return "watch";
  return "medium";
}

export function escalationProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 96563.0, in order. */
export function escalationProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96563) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
