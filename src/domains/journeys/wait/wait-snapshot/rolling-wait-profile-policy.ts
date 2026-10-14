import * as numbers from "../../../../kit/numbers.js";

export function rollingWaitProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling wait profile code in its canonical RWP- form. */
export function normalizeRollingWaitProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RWP-")) return clean;
  return `RWP-${clean.replaceAll(" ", "-")}`;
}
