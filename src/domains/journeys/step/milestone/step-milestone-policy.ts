import * as numbers from "../../../../kit/numbers.js";

/** Names the band a step milestone score falls in. */
export function classifyStepMilestone(score: number): string {
  if (score < 16) return "ok";
  if (score < 56.8) return "critical";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 39054.0, in order. */
export function stepMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39054) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function stepMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
