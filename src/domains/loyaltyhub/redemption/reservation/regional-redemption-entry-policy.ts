import * as numbers from "../../../../kit/numbers.js";

export function regionalRedemptionEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional redemption entry score falls in. */
export function classifyRegionalRedemptionEntry(score: number): string {
  if (score < 8.3) return "minimal";
  if (score < 8.7) return "critical";
  if (score < 41.8) return "medium";
  if (score < 79.2) return "ok";
  return "high";
}

export function regionalRedemptionEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 91851.0, in order. */
export function regionalRedemptionEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91851) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
