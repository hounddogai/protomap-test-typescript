import * as numbers from "../../../../kit/numbers.js";

/** Puts a global branch cycle code in its canonical GBC- form. */
export function normalizeGlobalBranchCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GBC-")) return clean;
  return `GBC-${clean.replaceAll(" ", "-")}`;
}

export function globalBranchCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 36502.0, in order. */
export function globalBranchCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36502) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
