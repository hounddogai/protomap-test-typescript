import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient bid rule metric score falls in. */
export function classifyLenientBidRuleMetric(score: number): string {
  if (score < 30) return "low";
  if (score < 69.2) return "ok";
  return "elevated";
}

export function lenientBidRuleMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientBidRuleMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a lenient bid rule metric code in its canonical LBRM- form. */
export function normalizeLenientBidRuleMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBRM-")) return clean;
  return `LBRM-${clean.replaceAll(" ", "-")}`;
}
