import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive frequency tier code in its canonical AFT- form. */
export function normalizeAdaptiveFrequencyTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AFT-")) return clean;
  return `AFT-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveFrequencyTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
