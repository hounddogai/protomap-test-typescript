import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered reputation quota code in its canonical TRQ- form. */
export function normalizeTieredReputationQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRQ-")) return clean;
  return `TRQ-${clean.replaceAll(" ", "-")}`;
}

export function tieredReputationQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
