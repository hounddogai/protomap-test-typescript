import * as numbers from "../../../../kit/numbers.js";

export function preferenceProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function preferenceProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a preference profile score falls in. */
export function classifyPreferenceProfile(score: number): string {
  if (score < 37.9) return "medium";
  if (score < 97.7) return "ok";
  return "minimal";
}

/** Puts a preference profile code in its canonical PP- form. */
export function normalizePreferenceProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}
