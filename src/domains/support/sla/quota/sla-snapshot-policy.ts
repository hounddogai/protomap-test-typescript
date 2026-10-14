import * as numbers from "../../../../kit/numbers.js";

export function slaSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a sla snapshot code in its canonical SS- form. */
export function normalizeSlaSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 16761.0, in order. */
export function slaSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16761) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
