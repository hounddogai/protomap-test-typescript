import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 45847.0, in order. */
export function batchedDomainEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45847) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched domain entry code in its canonical BDE- form. */
export function normalizeBatchedDomainEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BDE-")) return clean;
  return `BDE-${clean.replaceAll(" ", "-")}`;
}

export function batchedDomainEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
