import * as numbers from "../../../../kit/numbers.js";

export function domainSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a domain summary code in its canonical DS- form. */
export function normalizeDomainSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DS-")) return clean;
  return `DS-${clean.replaceAll(" ", "-")}`;
}
