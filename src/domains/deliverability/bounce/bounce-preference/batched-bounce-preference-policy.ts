import * as numbers from "../../../../kit/numbers.js";

export function batchedBouncePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a batched bounce preference code in its canonical BBP- form. */
export function normalizeBatchedBouncePreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BBP-")) return clean;
  return `BBP-${clean.replaceAll(" ", "-")}`;
}

export function batchedBouncePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
