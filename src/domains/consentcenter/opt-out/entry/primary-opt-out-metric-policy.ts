import * as numbers from "../../../../kit/numbers.js";

export function primaryOptOutMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary opt out metric code in its canonical POOM- form. */
export function normalizePrimaryOptOutMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("POOM-")) return clean;
  return `POOM-${clean.replaceAll(" ", "-")}`;
}
