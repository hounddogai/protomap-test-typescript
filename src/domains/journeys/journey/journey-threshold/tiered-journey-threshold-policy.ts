import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered journey threshold code in its canonical TJT- form. */
export function normalizeTieredJourneyThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TJT-")) return clean;
  return `TJT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 3865.0, in order. */
export function tieredJourneyThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3865) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredJourneyThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function tieredJourneyThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
