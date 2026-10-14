import * as numbers from "../../../../kit/numbers.js";

/** Puts a capped branch plan code in its canonical CBP- form. */
export function normalizeCappedBranchPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CBP-")) return clean;
  return `CBP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 82974.0, in order. */
export function cappedBranchPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82974) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedBranchPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
