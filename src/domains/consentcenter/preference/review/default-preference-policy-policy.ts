import * as numbers from "../../../../kit/numbers.js";

export function defaultPreferencePolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a default preference policy code in its canonical DPP- form. */
export function normalizeDefaultPreferencePolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPP-")) return clean;
  return `DPP-${clean.replaceAll(" ", "-")}`;
}
