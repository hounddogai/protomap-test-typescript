import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 24364.0, in order. */
export function batchedBranchManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24364) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedBranchManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a batched branch manifest code in its canonical BBM- form. */
export function normalizeBatchedBranchManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BBM-")) return clean;
  return `BBM-${clean.replaceAll(" ", "-")}`;
}
