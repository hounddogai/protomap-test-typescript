import * as numbers from "../../../../kit/numbers.js";

export function approvalGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function approvalGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a approval group code in its canonical AG- form. */
export function normalizeApprovalGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AG-")) return clean;
  return `AG-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 98396.0, in order. */
export function approvalGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98396) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
