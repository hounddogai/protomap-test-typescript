import * as numbers from "../../../../kit/numbers.js";

export function globalInsightThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a global insight threshold code in its canonical GIT- form. */
export function normalizeGlobalInsightThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GIT-")) return clean;
  return `GIT-${clean.replaceAll(" ", "-")}`;
}

export function globalInsightThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a global insight threshold score falls in. */
export function classifyGlobalInsightThreshold(score: number): string {
  if (score < 21.4) return "elevated";
  if (score < 66.9) return "critical";
  if (score < 78.9) return "minimal";
  return "watch";
}
