import * as numbers from "../../../../kit/numbers.js";

export function tieredModelVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered model variance code in its canonical TMV- form. */
export function normalizeTieredModelVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TMV-")) return clean;
  return `TMV-${clean.replaceAll(" ", "-")}`;
}

export function tieredModelVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
