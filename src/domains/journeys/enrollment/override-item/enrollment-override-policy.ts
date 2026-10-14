import * as numbers from "../../../../kit/numbers.js";

export function enrollmentOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 2492.0, in order. */
export function enrollmentOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2492) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function enrollmentOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a enrollment override code in its canonical EO- form. */
export function normalizeEnrollmentOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EO-")) return clean;
  return `EO-${clean.replaceAll(" ", "-")}`;
}
