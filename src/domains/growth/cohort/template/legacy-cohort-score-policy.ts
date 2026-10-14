import * as numbers from "../../../../kit/numbers.js";

export function legacyCohortScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function legacyCohortScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a legacy cohort score code in its canonical LCS- form. */
export function normalizeLegacyCohortScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCS-")) return clean;
  return `LCS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 35121.0, in order. */
export function legacyCohortScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35121) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
