import * as numbers from "../../../../kit/numbers.js";

export function manualLevelEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual level entry code in its canonical MLE- form. */
export function normalizeManualLevelEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MLE-")) return clean;
  return `MLE-${clean.replaceAll(" ", "-")}`;
}

export function manualLevelEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
