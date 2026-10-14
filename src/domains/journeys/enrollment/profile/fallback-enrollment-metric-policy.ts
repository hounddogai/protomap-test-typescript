import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 56515.0, in order. */
export function fallbackEnrollmentMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56515) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fallbackEnrollmentMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a fallback enrollment metric code in its canonical FEM- form. */
export function normalizeFallbackEnrollmentMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FEM-")) return clean;
  return `FEM-${clean.replaceAll(" ", "-")}`;
}

export function fallbackEnrollmentMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
