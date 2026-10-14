import * as numbers from "../../../../kit/numbers.js";

/** Names the band a tiered reward cycle score falls in. */
export function classifyTieredRewardCycle(score: number): string {
  if (score < 23.9) return "ok";
  if (score < 84.7) return "low";
  if (score < 96) return "critical";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 88314.0, in order. */
export function tieredRewardCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88314) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredRewardCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tieredRewardCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
