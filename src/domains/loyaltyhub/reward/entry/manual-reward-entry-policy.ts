import * as numbers from "../../../../kit/numbers.js";

export function manualRewardEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function manualRewardEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual reward entry code in its canonical MRE- form. */
export function normalizeManualRewardEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRE-")) return clean;
  return `MRE-${clean.replaceAll(" ", "-")}`;
}
