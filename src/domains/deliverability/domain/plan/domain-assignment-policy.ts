import * as numbers from "../../../../kit/numbers.js";

/** Puts a domain assignment code in its canonical DA- form. */
export function normalizeDomainAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DA-")) return clean;
  return `DA-${clean.replaceAll(" ", "-")}`;
}

export function domainAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.09;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
