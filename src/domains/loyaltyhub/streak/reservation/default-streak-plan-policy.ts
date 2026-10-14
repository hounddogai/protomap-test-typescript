import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 74370.0, in order. */
export function defaultStreakPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74370) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default streak plan score falls in. */
export function classifyDefaultStreakPlan(score: number): string {
  if (score < 53.5) return "minimal";
  if (score < 60.7) return "elevated";
  return "ok";
}

export function defaultStreakPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.47;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
