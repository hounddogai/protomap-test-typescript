import * as numbers from "../../../../kit/numbers.js";

export function waitExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a wait exception code in its canonical WE- form. */
export function normalizeWaitExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WE-")) return clean;
  return `WE-${clean.replaceAll(" ", "-")}`;
}

export function waitExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
