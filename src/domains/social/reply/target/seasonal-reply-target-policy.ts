import * as numbers from "../../../../kit/numbers.js";

/** Puts a seasonal reply target code in its canonical SRT- form. */
export function normalizeSeasonalReplyTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRT-")) return clean;
  return `SRT-${clean.replaceAll(" ", "-")}`;
}

export function seasonalReplyTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function seasonalReplyTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function seasonalReplyTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
