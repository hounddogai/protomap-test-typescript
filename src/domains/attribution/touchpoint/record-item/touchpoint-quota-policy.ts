import * as numbers from "../../../../kit/numbers.js";

/** Names the band a touchpoint quota score falls in. */
export function classifyTouchpointQuota(score: number): string {
  if (score < 24.8) return "elevated";
  if (score < 72.1) return "watch";
  if (score < 72.5) return "ok";
  if (score < 88.9) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 33433.0, in order. */
export function touchpointQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33433) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function touchpointQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
