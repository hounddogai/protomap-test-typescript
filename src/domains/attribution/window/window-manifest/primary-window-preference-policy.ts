import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 96779.0, in order. */
export function primaryWindowPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96779) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary window preference code in its canonical PWP- form. */
export function normalizePrimaryWindowPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PWP-")) return clean;
  return `PWP-${clean.replaceAll(" ", "-")}`;
}

export function primaryWindowPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
