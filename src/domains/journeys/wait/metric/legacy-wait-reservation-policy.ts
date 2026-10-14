import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 73912.0, in order. */
export function legacyWaitReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73912) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyWaitReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a legacy wait reservation code in its canonical LWR- form. */
export function normalizeLegacyWaitReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWR-")) return clean;
  return `LWR-${clean.replaceAll(" ", "-")}`;
}
