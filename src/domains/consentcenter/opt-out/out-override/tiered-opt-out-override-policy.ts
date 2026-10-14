import * as numbers from "../../../../kit/numbers.js";

export function tieredOptOutOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered opt out override code in its canonical TOOO- form. */
export function normalizeTieredOptOutOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TOOO-")) return clean;
  return `TOOO-${clean.replaceAll(" ", "-")}`;
}

export function tieredOptOutOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
