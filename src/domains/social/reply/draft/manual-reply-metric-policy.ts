import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 63430.0, in order. */
export function manualReplyMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63430) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualReplyMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a manual reply metric code in its canonical MRM- form. */
export function normalizeManualReplyMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRM-")) return clean;
  return `MRM-${clean.replaceAll(" ", "-")}`;
}
