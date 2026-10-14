import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive double opt in slot code in its canonical ADOIS- form. */
export function normalizeAdaptiveDoubleOptInSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ADOIS-")) return clean;
  return `ADOIS-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveDoubleOptInSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveDoubleOptInSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
