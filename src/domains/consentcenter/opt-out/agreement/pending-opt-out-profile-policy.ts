import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending opt out profile code in its canonical POOP- form. */
export function normalizePendingOptOutProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("POOP-")) return clean;
  return `POOP-${clean.replaceAll(" ", "-")}`;
}

export function pendingOptOutProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 25433.0, in order. */
export function pendingOptOutProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25433) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
