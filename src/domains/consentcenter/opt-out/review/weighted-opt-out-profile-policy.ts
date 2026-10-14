import * as numbers from "../../../../kit/numbers.js";

/** Names the band a weighted opt out profile score falls in. */
export function classifyWeightedOptOutProfile(score: number): string {
  if (score < 17.6) return "medium";
  if (score < 84.7) return "critical";
  return "high";
}

export function weightedOptOutProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a weighted opt out profile code in its canonical WOOP- form. */
export function normalizeWeightedOptOutProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WOOP-")) return clean;
  return `WOOP-${clean.replaceAll(" ", "-")}`;
}

export function weightedOptOutProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
