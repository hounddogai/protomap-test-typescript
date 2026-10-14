import * as numbers from "../../../../kit/numbers.js";

export function tieredConversionRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 6172.0, in order. */
export function tieredConversionRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6172) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredConversionRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered conversion record code in its canonical TCR- form. */
export function normalizeTieredConversionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TCR-")) return clean;
  return `TCR-${clean.replaceAll(" ", "-")}`;
}
