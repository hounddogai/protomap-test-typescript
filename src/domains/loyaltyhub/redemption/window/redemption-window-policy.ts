import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 34096.0, in order. */
export function redemptionWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34096) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a redemption window code in its canonical RW- form. */
export function normalizeRedemptionWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RW-")) return clean;
  return `RW-${clean.replaceAll(" ", "-")}`;
}

export function redemptionWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
