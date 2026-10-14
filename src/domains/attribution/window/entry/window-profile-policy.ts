import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 95789.0, in order. */
export function windowProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95789) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a window profile code in its canonical WP- form. */
export function normalizeWindowProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WP-")) return clean;
  return `WP-${clean.replaceAll(" ", "-")}`;
}

export function windowProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
