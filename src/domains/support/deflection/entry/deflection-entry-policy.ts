import * as numbers from "../../../../kit/numbers.js";

/** Puts a deflection entry code in its canonical DE- form. */
export function normalizeDeflectionEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DE-")) return clean;
  return `DE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 68095.0, in order. */
export function deflectionEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68095) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function deflectionEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function deflectionEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
