import * as numbers from "../../../../kit/numbers.js";

export function adaptiveDomainGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive domain group score falls in. */
export function classifyAdaptiveDomainGroup(score: number): string {
  if (score < 24.6) return "ok";
  if (score < 54.8) return "minimal";
  if (score < 70.4) return "medium";
  if (score < 79) return "high";
  return "elevated";
}

export function adaptiveDomainGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 6564.0, in order. */
export function adaptiveDomainGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6564) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
