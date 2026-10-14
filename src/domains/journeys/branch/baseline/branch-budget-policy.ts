import * as numbers from "../../../../kit/numbers.js";

export function branchBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a branch budget score falls in. */
export function classifyBranchBudget(score: number): string {
  if (score < 7.9) return "watch";
  if (score < 33.2) return "ok";
  if (score < 68.4) return "medium";
  if (score < 84.8) return "minimal";
  return "low";
}

export function branchBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
