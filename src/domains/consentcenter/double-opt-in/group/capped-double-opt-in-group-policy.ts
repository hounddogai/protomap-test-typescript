import * as numbers from "../../../../kit/numbers.js";

export function cappedDoubleOptInGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a capped double opt in group code in its canonical CDOIG- form. */
export function normalizeCappedDoubleOptInGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CDOIG-")) return clean;
  return `CDOIG-${clean.replaceAll(" ", "-")}`;
}
