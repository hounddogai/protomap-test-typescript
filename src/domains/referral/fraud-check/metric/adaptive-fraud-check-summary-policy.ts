import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive fraud check summary code in its canonical AFCS- form. */
export function normalizeAdaptiveFraudCheckSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AFCS-")) return clean;
  return `AFCS-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveFraudCheckSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
