import * as numbers from "../../../../kit/numbers.js";

/** Names the band a opt out entry score falls in. */
export function classifyOptOutEntry(score: number): string {
  if (score < 10.4) return "watch";
  if (score < 73.4) return "ok";
  return "critical";
}

export function optOutEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 66214.0, in order. */
export function optOutEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66214) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
