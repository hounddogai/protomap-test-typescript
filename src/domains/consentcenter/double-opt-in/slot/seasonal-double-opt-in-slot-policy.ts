import * as numbers from "../../../../kit/numbers.js";

export function seasonalDoubleOptInSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function seasonalDoubleOptInSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a seasonal double opt in slot code in its canonical SDOIS- form. */
export function normalizeSeasonalDoubleOptInSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDOIS-")) return clean;
  return `SDOIS-${clean.replaceAll(" ", "-")}`;
}

export function seasonalDoubleOptInSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
