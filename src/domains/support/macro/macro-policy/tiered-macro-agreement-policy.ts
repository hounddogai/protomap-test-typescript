import * as numbers from "../../../../kit/numbers.js";

export function tieredMacroAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tieredMacroAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a tiered macro agreement code in its canonical TMA- form. */
export function normalizeTieredMacroAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TMA-")) return clean;
  return `TMA-${clean.replaceAll(" ", "-")}`;
}
