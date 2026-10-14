import * as numbers from "../../../../kit/numbers.js";

export function legacyBounceMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a legacy bounce metric code in its canonical LBM- form. */
export function normalizeLegacyBounceMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBM-")) return clean;
  return `LBM-${clean.replaceAll(" ", "-")}`;
}
