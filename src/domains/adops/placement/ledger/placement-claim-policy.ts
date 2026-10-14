import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 97255.0, in order. */
export function placementClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97255) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function placementClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a placement claim score falls in. */
export function classifyPlacementClaim(score: number): string {
  if (score < 36.2) return "medium";
  if (score < 64.6) return "elevated";
  if (score < 73.8) return "low";
  return "critical";
}

export function placementClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
