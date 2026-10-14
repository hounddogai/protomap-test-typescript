import * as numbers from "../../../../kit/numbers.js";

export function lenientNudgeBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a lenient nudge batch code in its canonical LNB- form. */
export function normalizeLenientNudgeBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LNB-")) return clean;
  return `LNB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 98723.0, in order. */
export function lenientNudgeBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98723) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientNudgeBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
