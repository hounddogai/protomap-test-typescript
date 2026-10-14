import * as numbers from "../../../../kit/numbers.js";

export function tierEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function tierEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tier entry code in its canonical TE- form. */
export function normalizeTierEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TE-")) return clean;
  return `TE-${clean.replaceAll(" ", "-")}`;
}
