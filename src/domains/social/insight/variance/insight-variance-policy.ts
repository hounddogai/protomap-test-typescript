import * as numbers from "../../../../kit/numbers.js";

export function insightVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a insight variance score falls in. */
export function classifyInsightVariance(score: number): string {
  if (score < 22) return "medium";
  if (score < 67.4) return "elevated";
  return "watch";
}

export function insightVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a insight variance code in its canonical IV- form. */
export function normalizeInsightVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IV-")) return clean;
  return `IV-${clean.replaceAll(" ", "-")}`;
}
