import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 75029.0, in order. */
export function redemptionBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75029) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a redemption batch code in its canonical RB- form. */
export function normalizeRedemptionBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RB-")) return clean;
  return `RB-${clean.replaceAll(" ", "-")}`;
}

export function redemptionBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
