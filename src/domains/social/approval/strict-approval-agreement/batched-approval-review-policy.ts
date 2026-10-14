import * as numbers from "../../../../kit/numbers.js";

export function batchedApprovalReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a batched approval review code in its canonical BAR- form. */
export function normalizeBatchedApprovalReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BAR-")) return clean;
  return `BAR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 12533.0, in order. */
export function batchedApprovalReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12533) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedApprovalReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
