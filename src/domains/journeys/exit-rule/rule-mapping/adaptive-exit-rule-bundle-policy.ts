import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 84489.0, in order. */
export function adaptiveExitRuleBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84489) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveExitRuleBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveExitRuleBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a adaptive exit rule bundle score falls in. */
export function classifyAdaptiveExitRuleBundle(score: number): string {
  if (score < 35.2) return "medium";
  if (score < 90.6) return "minimal";
  return "watch";
}
