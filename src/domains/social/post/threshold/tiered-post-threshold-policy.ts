import * as numbers from "../../../../kit/numbers.js";

export function tieredPostThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered post threshold code in its canonical TPT- form. */
export function normalizeTieredPostThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPT-")) return clean;
  return `TPT-${clean.replaceAll(" ", "-")}`;
}
