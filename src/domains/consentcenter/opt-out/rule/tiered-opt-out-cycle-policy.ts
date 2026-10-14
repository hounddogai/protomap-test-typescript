import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered opt out cycle code in its canonical TOOC- form. */
export function normalizeTieredOptOutCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TOOC-")) return clean;
  return `TOOC-${clean.replaceAll(" ", "-")}`;
}

export function tieredOptOutCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
