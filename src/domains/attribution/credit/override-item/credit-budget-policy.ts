import * as numbers from "../../../../kit/numbers.js";

/** Puts a credit budget code in its canonical CB- form. */
export function normalizeCreditBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CB-")) return clean;
  return `CB-${clean.replaceAll(" ", "-")}`;
}

export function creditBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 65058.0, in order. */
export function creditBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 65058) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
