import * as numbers from "../../../../kit/numbers.js";

/** Puts a preference budget code in its canonical PB- form. */
export function normalizePreferenceBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}

export function preferenceBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
