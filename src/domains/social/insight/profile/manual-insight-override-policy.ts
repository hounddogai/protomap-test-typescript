import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual insight override score falls in. */
export function classifyManualInsightOverride(score: number): string {
  if (score < 6.9) return "minimal";
  if (score < 71.1) return "elevated";
  if (score < 85.5) return "low";
  return "high";
}

export function manualInsightOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 20961.0, in order. */
export function manualInsightOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20961) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
