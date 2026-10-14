import * as numbers from "../../../../kit/numbers.js";

export function batchedMacroScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a batched macro score code in its canonical BMS- form. */
export function normalizeBatchedMacroScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BMS-")) return clean;
  return `BMS-${clean.replaceAll(" ", "-")}`;
}
