import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient proof threshold code in its canonical LPT- form. */
export function normalizeLenientProofThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPT-")) return clean;
  return `LPT-${clean.replaceAll(" ", "-")}`;
}

export function lenientProofThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 60651.0, in order. */
export function lenientProofThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60651) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientProofThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
