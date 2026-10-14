import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 9014.0, in order. */
export function journeyRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9014) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function journeyRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a journey rule score falls in. */
export function classifyJourneyRule(score: number): string {
  if (score < 13.2) return "minimal";
  if (score < 32.4) return "elevated";
  return "low";
}
