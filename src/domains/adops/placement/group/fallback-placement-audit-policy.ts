import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback placement audit code in its canonical FPA- form. */
export function normalizeFallbackPlacementAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FPA-")) return clean;
  return `FPA-${clean.replaceAll(" ", "-")}`;
}

export function fallbackPlacementAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function fallbackPlacementAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
