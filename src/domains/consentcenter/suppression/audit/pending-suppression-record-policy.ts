import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending suppression record code in its canonical PSR- form. */
export function normalizePendingSuppressionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSR-")) return clean;
  return `PSR-${clean.replaceAll(" ", "-")}`;
}

export function pendingSuppressionRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function pendingSuppressionRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
