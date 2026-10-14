import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 52285.0, in order. */
export function mentionAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52285) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a mention allocation code in its canonical MA- form. */
export function normalizeMentionAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MA-")) return clean;
  return `MA-${clean.replaceAll(" ", "-")}`;
}

export function mentionAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
