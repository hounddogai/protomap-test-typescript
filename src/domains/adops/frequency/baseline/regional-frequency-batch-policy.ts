import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 61906.0, in order. */
export function regionalFrequencyBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61906) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function regionalFrequencyBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function regionalFrequencyBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a regional frequency batch code in its canonical RFB- form. */
export function normalizeRegionalFrequencyBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RFB-")) return clean;
  return `RFB-${clean.replaceAll(" ", "-")}`;
}
