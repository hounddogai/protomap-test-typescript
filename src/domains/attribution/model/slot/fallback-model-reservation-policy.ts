import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 93901.0, in order. */
export function fallbackModelReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93901) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fallbackModelReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fallback model reservation code in its canonical FMR- form. */
export function normalizeFallbackModelReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FMR-")) return clean;
  return `FMR-${clean.replaceAll(" ", "-")}`;
}
