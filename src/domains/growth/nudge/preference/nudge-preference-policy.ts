import * as numbers from "../../../../kit/numbers.js";

/** Puts a nudge preference code in its canonical NP- form. */
export function normalizeNudgePreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NP-")) return clean;
  return `NP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 89064.0, in order. */
export function nudgePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89064) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function nudgePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function nudgePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
