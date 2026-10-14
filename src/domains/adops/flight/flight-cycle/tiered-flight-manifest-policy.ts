import * as numbers from "../../../../kit/numbers.js";

export function tieredFlightManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a tiered flight manifest code in its canonical TFM- form. */
export function normalizeTieredFlightManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TFM-")) return clean;
  return `TFM-${clean.replaceAll(" ", "-")}`;
}

export function tieredFlightManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
