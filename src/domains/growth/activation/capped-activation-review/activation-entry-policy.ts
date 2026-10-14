import * as numbers from "../../../../kit/numbers.js";

/** Puts a activation entry code in its canonical AE- form. */
export function normalizeActivationEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AE-")) return clean;
  return `AE-${clean.replaceAll(" ", "-")}`;
}

export function activationEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
