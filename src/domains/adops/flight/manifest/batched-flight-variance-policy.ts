import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 66301.0, in order. */
export function batchedFlightVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66301) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched flight variance code in its canonical BFV- form. */
export function normalizeBatchedFlightVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BFV-")) return clean;
  return `BFV-${clean.replaceAll(" ", "-")}`;
}

export function batchedFlightVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
