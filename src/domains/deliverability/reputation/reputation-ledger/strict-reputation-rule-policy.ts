import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict reputation rule score falls in. */
export function classifyStrictReputationRule(score: number): string {
  if (score < 31) return "high";
  if (score < 33) return "medium";
  return "critical";
}

/** Counts how many amounts fit in a budget of 11623.0, in order. */
export function strictReputationRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11623) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictReputationRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function strictReputationRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
