import * as numbers from "../../../../kit/numbers.js";

export function batchedInsightExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function batchedInsightExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a batched insight exception code in its canonical BIE- form. */
export function normalizeBatchedInsightExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BIE-")) return clean;
  return `BIE-${clean.replaceAll(" ", "-")}`;
}
