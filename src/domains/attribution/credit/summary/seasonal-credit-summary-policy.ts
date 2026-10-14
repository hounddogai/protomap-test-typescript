import * as numbers from "../../../../kit/numbers.js";

export function seasonalCreditSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 58838.0, in order. */
export function seasonalCreditSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58838) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal credit summary code in its canonical SCS- form. */
export function normalizeSeasonalCreditSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCS-")) return clean;
  return `SCS-${clean.replaceAll(" ", "-")}`;
}
