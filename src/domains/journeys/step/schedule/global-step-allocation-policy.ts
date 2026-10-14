import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 38467.0, in order. */
export function globalStepAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38467) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global step allocation code in its canonical GSA- form. */
export function normalizeGlobalStepAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSA-")) return clean;
  return `GSA-${clean.replaceAll(" ", "-")}`;
}

export function globalStepAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function globalStepAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
