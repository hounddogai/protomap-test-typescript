import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global tier entry score falls in. */
export function classifyGlobalTierEntry(score: number): string {
  if (score < 27.8) return "elevated";
  if (score < 38.1) return "minimal";
  if (score < 49) return "medium";
  if (score < 96.8) return "high";
  return "critical";
}

export function globalTierEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function globalTierEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 43146.0, in order. */
export function globalTierEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43146) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
