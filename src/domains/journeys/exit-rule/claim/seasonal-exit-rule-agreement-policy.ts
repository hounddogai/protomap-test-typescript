import * as numbers from "../../../../kit/numbers.js";

export function seasonalExitRuleAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function seasonalExitRuleAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal exit rule agreement code in its canonical SERA- form. */
export function normalizeSeasonalExitRuleAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SERA-")) return clean;
  return `SERA-${clean.replaceAll(" ", "-")}`;
}
