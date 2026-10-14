import * as numbers from "../../../../kit/numbers.js";

export function globalStreakRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function globalStreakRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a global streak record code in its canonical GSR- form. */
export function normalizeGlobalStreakRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSR-")) return clean;
  return `GSR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a global streak record score falls in. */
export function classifyGlobalStreakRecord(score: number): string {
  if (score < 35.6) return "medium";
  if (score < 44.2) return "elevated";
  if (score < 59.3) return "ok";
  if (score < 81.4) return "watch";
  return "low";
}
