import * as numbers from "../../../../kit/numbers.js";

export function tieredModelDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered model digest code in its canonical TMD- form. */
export function normalizeTieredModelDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TMD-")) return clean;
  return `TMD-${clean.replaceAll(" ", "-")}`;
}
