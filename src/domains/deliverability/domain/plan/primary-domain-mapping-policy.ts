import * as numbers from "../../../../kit/numbers.js";

/** Puts a primary domain mapping code in its canonical PDM- form. */
export function normalizePrimaryDomainMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDM-")) return clean;
  return `PDM-${clean.replaceAll(" ", "-")}`;
}

export function primaryDomainMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
