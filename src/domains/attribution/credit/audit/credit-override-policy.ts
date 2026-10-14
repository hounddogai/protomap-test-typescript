import * as numbers from "../../../../kit/numbers.js";

/** Puts a credit override code in its canonical CO- form. */
export function normalizeCreditOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CO-")) return clean;
  return `CO-${clean.replaceAll(" ", "-")}`;
}

export function creditOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.47;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
