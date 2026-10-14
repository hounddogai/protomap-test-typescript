import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual creative ledger code in its canonical MCL- form. */
export function normalizeManualCreativeLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MCL-")) return clean;
  return `MCL-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 30650.0, in order. */
export function manualCreativeLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30650) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualCreativeLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function manualCreativeLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
