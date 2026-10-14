import * as numbers from "../../../../kit/numbers.js";

export function cappedFlightBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function cappedFlightBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a capped flight baseline code in its canonical CFB- form. */
export function normalizeCappedFlightBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFB-")) return clean;
  return `CFB-${clean.replaceAll(" ", "-")}`;
}

export function cappedFlightBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
