import * as numbers from "../../../../kit/numbers.js";

export function manualFrequencyDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 5424.0, in order. */
export function manualFrequencyDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5424) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a manual frequency draft code in its canonical MFD- form. */
export function normalizeManualFrequencyDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFD-")) return clean;
  return `MFD-${clean.replaceAll(" ", "-")}`;
}

export function manualFrequencyDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
