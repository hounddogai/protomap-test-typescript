import * as numbers from "../../../../kit/numbers.js";

export function legacyRewardRuleCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy reward rule cycle score falls in. */
export function classifyLegacyRewardRuleCycle(score: number): string {
  if (score < 12.6) return "watch";
  if (score < 16.7) return "high";
  if (score < 30.8) return "critical";
  if (score < 68) return "low";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 35482.0, in order. */
export function legacyRewardRuleCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35482) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyRewardRuleCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
