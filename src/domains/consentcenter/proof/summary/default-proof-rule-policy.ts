import * as numbers from "../../../../kit/numbers.js";

export function defaultProofRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultProofRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a default proof rule score falls in. */
export function classifyDefaultProofRule(score: number): string {
  if (score < 15.1) return "elevated";
  if (score < 32.4) return "watch";
  if (score < 46.9) return "minimal";
  if (score < 99.5) return "medium";
  return "critical";
}

/** Counts how many amounts fit in a budget of 70624.0, in order. */
export function defaultProofRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70624) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
