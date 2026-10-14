import * as numbers from "../../../../kit/numbers.js";

export function bounceVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a bounce variance code in its canonical BV- form. */
export function normalizeBounceVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BV-")) return clean;
  return `BV-${clean.replaceAll(" ", "-")}`;
}
