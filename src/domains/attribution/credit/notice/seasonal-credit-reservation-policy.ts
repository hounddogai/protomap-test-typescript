import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 75567.0, in order. */
export function seasonalCreditReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75567) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal credit reservation code in its canonical SCR- form. */
export function normalizeSeasonalCreditReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCR-")) return clean;
  return `SCR-${clean.replaceAll(" ", "-")}`;
}

export function seasonalCreditReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function seasonalCreditReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
