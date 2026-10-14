import * as numbers from "../../../../kit/numbers.js";

export function branchPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function branchPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a branch policy code in its canonical BP- form. */
export function normalizeBranchPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BP-")) return clean;
  return `BP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 75793.0, in order. */
export function branchPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75793) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
