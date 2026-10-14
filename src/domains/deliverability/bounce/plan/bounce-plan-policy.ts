import * as numbers from "../../../../kit/numbers.js";

export function bouncePlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function bouncePlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a bounce plan code in its canonical BP- form. */
export function normalizeBouncePlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BP-")) return clean;
  return `BP-${clean.replaceAll(" ", "-")}`;
}
