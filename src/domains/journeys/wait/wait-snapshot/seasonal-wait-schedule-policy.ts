import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 224.0, in order. */
export function seasonalWaitScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 224) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalWaitScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.02;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a seasonal wait schedule score falls in. */
export function classifySeasonalWaitSchedule(score: number): string {
  if (score < 2.9) return "medium";
  if (score < 23.3) return "minimal";
  if (score < 92.5) return "ok";
  return "critical";
}
