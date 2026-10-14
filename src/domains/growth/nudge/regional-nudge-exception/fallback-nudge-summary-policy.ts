import * as numbers from "../../../../kit/numbers.js";

export function fallbackNudgeSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 4808.0, in order. */
export function fallbackNudgeSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4808) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback nudge summary code in its canonical FNS- form. */
export function normalizeFallbackNudgeSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FNS-")) return clean;
  return `FNS-${clean.replaceAll(" ", "-")}`;
}
