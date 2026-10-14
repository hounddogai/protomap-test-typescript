import * as numbers from "../../../../kit/numbers.js";

/** Puts a flight variance code in its canonical FV- form. */
export function normalizeFlightVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FV-")) return clean;
  return `FV-${clean.replaceAll(" ", "-")}`;
}

export function flightVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
