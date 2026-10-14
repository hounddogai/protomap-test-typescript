import * as numbers from "../../../../kit/numbers.js";

export function batchedPostMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 23804.0, in order. */
export function batchedPostMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23804) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched post milestone code in its canonical BPM- form. */
export function normalizeBatchedPostMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPM-")) return clean;
  return `BPM-${clean.replaceAll(" ", "-")}`;
}
