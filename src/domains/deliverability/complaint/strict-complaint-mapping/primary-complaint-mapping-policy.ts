import * as numbers from "../../../../kit/numbers.js";

export function primaryComplaintMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary complaint mapping code in its canonical PCM- form. */
export function normalizePrimaryComplaintMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCM-")) return clean;
  return `PCM-${clean.replaceAll(" ", "-")}`;
}
