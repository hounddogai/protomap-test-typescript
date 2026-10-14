import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 66863.0, in order. */
export function regionalApprovalNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66863) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a regional approval notice code in its canonical RAN- form. */
export function normalizeRegionalApprovalNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAN-")) return clean;
  return `RAN-${clean.replaceAll(" ", "-")}`;
}

export function regionalApprovalNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
