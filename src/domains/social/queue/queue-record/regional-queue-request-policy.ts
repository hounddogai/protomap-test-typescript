import * as numbers from "../../../../kit/numbers.js";

export function regionalQueueRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 70929.0, in order. */
export function regionalQueueRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70929) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional queue request score falls in. */
export function classifyRegionalQueueRequest(score: number): string {
  if (score < 6.5) return "medium";
  if (score < 96.7) return "minimal";
  return "ok";
}
