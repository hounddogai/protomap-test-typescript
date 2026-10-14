import * as numbers from "../../../../kit/numbers.js";

/** Puts a badge mapping code in its canonical BM- form. */
export function normalizeBadgeMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BM-")) return clean;
  return `BM-${clean.replaceAll(" ", "-")}`;
}

export function badgeMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
