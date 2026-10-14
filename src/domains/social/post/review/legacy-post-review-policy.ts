import * as numbers from "../../../../kit/numbers.js";

export function legacyPostReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function legacyPostReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a legacy post review code in its canonical LPR- form. */
export function normalizeLegacyPostReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPR-")) return clean;
  return `LPR-${clean.replaceAll(" ", "-")}`;
}

export function legacyPostReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
