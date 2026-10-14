import * as numbers from "../../../../kit/numbers.js";

/** Names the band a placement budget score falls in. */
export function classifyPlacementBudget(score: number): string {
  if (score < 4) return "minimal";
  if (score < 6) return "elevated";
  if (score < 11.6) return "critical";
  if (score < 95.5) return "watch";
  return "high";
}

export function placementBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 37301.0, in order. */
export function placementBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37301) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a placement budget code in its canonical PB- form. */
export function normalizePlacementBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}
