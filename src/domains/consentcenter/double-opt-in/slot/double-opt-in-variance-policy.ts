import * as numbers from "../../../../kit/numbers.js";

/** Puts a double opt in variance code in its canonical DOIV- form. */
export function normalizeDoubleOptInVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIV-")) return clean;
  return `DOIV-${clean.replaceAll(" ", "-")}`;
}

export function doubleOptInVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
