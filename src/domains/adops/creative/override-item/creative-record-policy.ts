import * as numbers from "../../../../kit/numbers.js";

export function creativeRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function creativeRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a creative record code in its canonical CR- form. */
export function normalizeCreativeRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 24929.0, in order. */
export function creativeRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24929) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
