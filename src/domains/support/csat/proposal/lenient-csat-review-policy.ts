import * as numbers from "../../../../kit/numbers.js";

export function lenientCsatReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a lenient csat review code in its canonical LCR- form. */
export function normalizeLenientCsatReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCR-")) return clean;
  return `LCR-${clean.replaceAll(" ", "-")}`;
}

export function lenientCsatReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
