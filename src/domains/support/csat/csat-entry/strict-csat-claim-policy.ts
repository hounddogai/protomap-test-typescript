import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict csat claim code in its canonical SCC- form. */
export function normalizeStrictCsatClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCC-")) return clean;
  return `SCC-${clean.replaceAll(" ", "-")}`;
}

export function strictCsatClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictCsatClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
