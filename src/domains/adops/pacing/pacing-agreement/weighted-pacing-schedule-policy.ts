import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted pacing schedule code in its canonical WPS- form. */
export function normalizeWeightedPacingScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPS-")) return clean;
  return `WPS-${clean.replaceAll(" ", "-")}`;
}

export function weightedPacingScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function weightedPacingScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 14699.0, in order. */
export function weightedPacingScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14699) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
