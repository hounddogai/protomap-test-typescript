import * as numbers from "../../../../kit/numbers.js";

/** Puts a window budget code in its canonical WB- form. */
export function normalizeWindowBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WB-")) return clean;
  return `WB-${clean.replaceAll(" ", "-")}`;
}

export function windowBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
