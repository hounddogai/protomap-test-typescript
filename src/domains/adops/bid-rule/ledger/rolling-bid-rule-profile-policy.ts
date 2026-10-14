import * as numbers from "../../../../kit/numbers.js";

export function rollingBidRuleProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function rollingBidRuleProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling bid rule profile code in its canonical RBRP- form. */
export function normalizeRollingBidRuleProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBRP-")) return clean;
  return `RBRP-${clean.replaceAll(" ", "-")}`;
}
