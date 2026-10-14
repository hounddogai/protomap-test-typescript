import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 57022.0, in order. */
export function fallbackChallengeLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57022) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback challenge ledger code in its canonical FCL- form. */
export function normalizeFallbackChallengeLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCL-")) return clean;
  return `FCL-${clean.replaceAll(" ", "-")}`;
}

export function fallbackChallengeLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function fallbackChallengeLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
