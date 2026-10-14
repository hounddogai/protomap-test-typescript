import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 11009.0, in order. */
export function seasonalFrequencyPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11009) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function seasonalFrequencyPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function seasonalFrequencyPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a seasonal frequency policy code in its canonical SFP- form. */
export function normalizeSeasonalFrequencyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFP-")) return clean;
  return `SFP-${clean.replaceAll(" ", "-")}`;
}
