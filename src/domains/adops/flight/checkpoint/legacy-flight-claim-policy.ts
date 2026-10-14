import * as numbers from "../../../../kit/numbers.js";

export function legacyFlightClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function legacyFlightClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a legacy flight claim code in its canonical LFC- form. */
export function normalizeLegacyFlightClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFC-")) return clean;
  return `LFC-${clean.replaceAll(" ", "-")}`;
}
