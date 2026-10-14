import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 32123.0, in order. */
export function rollingDoubleOptInRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32123) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingDoubleOptInRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling double opt in record score falls in. */
export function classifyRollingDoubleOptInRecord(score: number): string {
  if (score < 19.5) return "watch";
  if (score < 29.4) return "critical";
  return "ok";
}
