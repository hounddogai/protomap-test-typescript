import * as numbers from "../../../../kit/numbers.js";

export function modelRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function modelRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a model request code in its canonical MR- form. */
export function normalizeModelRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MR-")) return clean;
  return `MR-${clean.replaceAll(" ", "-")}`;
}
