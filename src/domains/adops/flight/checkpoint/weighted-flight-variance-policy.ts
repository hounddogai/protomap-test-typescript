import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted flight variance code in its canonical WFV- form. */
export function normalizeWeightedFlightVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WFV-")) return clean;
  return `WFV-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted flight variance score falls in. */
export function classifyWeightedFlightVariance(score: number): string {
  if (score < 45.5) return "elevated";
  if (score < 94.7) return "low";
  return "ok";
}

export function weightedFlightVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 24108.0, in order. */
export function weightedFlightVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24108) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
