import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual streak tier code in its canonical MST- form. */
export function normalizeManualStreakTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MST-")) return clean;
  return `MST-${clean.replaceAll(" ", "-")}`;
}

export function manualStreakTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function manualStreakTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
