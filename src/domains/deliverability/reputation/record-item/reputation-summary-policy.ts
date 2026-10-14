import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 41889.0, in order. */
export function reputationSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41889) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function reputationSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function reputationSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a reputation summary score falls in. */
export function classifyReputationSummary(score: number): string {
  if (score < 14.2) return "medium";
  if (score < 20.8) return "high";
  if (score < 39.2) return "watch";
  if (score < 49.5) return "ok";
  return "elevated";
}
