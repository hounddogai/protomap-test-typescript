import * as numbers from "../../../../kit/numbers.js";

export function badgeAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a badge allocation code in its canonical BA- form. */
export function normalizeBadgeAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 40844.0, in order. */
export function badgeAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40844) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
