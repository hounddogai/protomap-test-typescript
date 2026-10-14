import * as numbers from "../../../../kit/numbers.js";

export function bounceRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a bounce record code in its canonical BR- form. */
export function normalizeBounceRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BR-")) return clean;
  return `BR-${clean.replaceAll(" ", "-")}`;
}
