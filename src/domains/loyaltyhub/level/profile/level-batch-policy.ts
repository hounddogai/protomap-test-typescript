import * as numbers from "../../../../kit/numbers.js";

/** Puts a level batch code in its canonical LB- form. */
export function normalizeLevelBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LB-")) return clean;
  return `LB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a level batch score falls in. */
export function classifyLevelBatch(score: number): string {
  if (score < 51.3) return "low";
  if (score < 57.3) return "watch";
  if (score < 76.5) return "elevated";
  return "minimal";
}

export function levelBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function levelBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
