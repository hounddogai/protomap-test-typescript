import * as numbers from "../../../../kit/numbers.js";

export function regionalFrequencyForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a regional frequency forecast code in its canonical RFF- form. */
export function normalizeRegionalFrequencyForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RFF-")) return clean;
  return `RFF-${clean.replaceAll(" ", "-")}`;
}
