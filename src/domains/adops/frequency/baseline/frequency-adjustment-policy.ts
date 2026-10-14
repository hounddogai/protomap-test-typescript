import * as numbers from "../../../../kit/numbers.js";

export function frequencyAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function frequencyAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a frequency adjustment code in its canonical FA- form. */
export function normalizeFrequencyAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FA-")) return clean;
  return `FA-${clean.replaceAll(" ", "-")}`;
}
