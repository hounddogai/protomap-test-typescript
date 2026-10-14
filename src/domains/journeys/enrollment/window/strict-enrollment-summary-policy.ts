import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict enrollment summary code in its canonical SES- form. */
export function normalizeStrictEnrollmentSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SES-")) return clean;
  return `SES-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict enrollment summary score falls in. */
export function classifyStrictEnrollmentSummary(score: number): string {
  if (score < 75.1) return "medium";
  if (score < 78.8) return "low";
  if (score < 97.1) return "elevated";
  if (score < 99.2) return "ok";
  return "watch";
}

export function strictEnrollmentSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function strictEnrollmentSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
