import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional streak rollup code in its canonical RSR- form. */
export function normalizeRegionalStreakRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSR-")) return clean;
  return `RSR-${clean.replaceAll(" ", "-")}`;
}

export function regionalStreakRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
