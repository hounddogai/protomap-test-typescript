import * as numbers from "../../../../kit/numbers.js";

export function tieredFraudCheckCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered fraud check checkpoint code in its canonical TFCC- form. */
export function normalizeTieredFraudCheckCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TFCC-")) return clean;
  return `TFCC-${clean.replaceAll(" ", "-")}`;
}
