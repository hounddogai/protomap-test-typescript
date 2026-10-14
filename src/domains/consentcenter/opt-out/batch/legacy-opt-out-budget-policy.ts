import * as numbers from "../../../../kit/numbers.js";

/** Puts a legacy opt out budget code in its canonical LOOB- form. */
export function normalizeLegacyOptOutBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LOOB-")) return clean;
  return `LOOB-${clean.replaceAll(" ", "-")}`;
}

export function legacyOptOutBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
