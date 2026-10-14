import * as numbers from "../../../../kit/numbers.js";

/** Names the band a window estimate score falls in. */
export function classifyWindowEstimate(score: number): string {
  if (score < 12.3) return "high";
  if (score < 42.6) return "medium";
  if (score < 46.8) return "watch";
  return "elevated";
}

export function windowEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function windowEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a window estimate code in its canonical WE- form. */
export function normalizeWindowEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WE-")) return clean;
  return `WE-${clean.replaceAll(" ", "-")}`;
}
