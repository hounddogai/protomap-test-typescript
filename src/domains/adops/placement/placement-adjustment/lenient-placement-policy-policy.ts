import * as numbers from "../../../../kit/numbers.js";

export function lenientPlacementPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientPlacementPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function lenientPlacementPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a lenient placement policy code in its canonical LPP- form. */
export function normalizeLenientPlacementPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPP-")) return clean;
  return `LPP-${clean.replaceAll(" ", "-")}`;
}
