import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual insight adjustment code in its canonical MIA- form. */
export function normalizeManualInsightAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MIA-")) return clean;
  return `MIA-${clean.replaceAll(" ", "-")}`;
}

export function manualInsightAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
