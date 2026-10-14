import * as numbers from "../../../../kit/numbers.js";

/** Puts a default redemption exception code in its canonical DRE- form. */
export function normalizeDefaultRedemptionExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DRE-")) return clean;
  return `DRE-${clean.replaceAll(" ", "-")}`;
}

export function defaultRedemptionExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function defaultRedemptionExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 6639.0, in order. */
export function defaultRedemptionExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6639) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
