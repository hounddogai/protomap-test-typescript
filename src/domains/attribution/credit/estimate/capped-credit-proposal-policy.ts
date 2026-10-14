import * as numbers from "../../../../kit/numbers.js";

export function cappedCreditProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a capped credit proposal code in its canonical CCP- form. */
export function normalizeCappedCreditProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CCP-")) return clean;
  return `CCP-${clean.replaceAll(" ", "-")}`;
}
