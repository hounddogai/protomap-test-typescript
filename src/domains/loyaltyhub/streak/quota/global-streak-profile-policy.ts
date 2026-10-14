import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global streak profile score falls in. */
export function classifyGlobalStreakProfile(score: number): string {
  if (score < 15.2) return "high";
  if (score < 84.8) return "medium";
  return "watch";
}

/** Puts a global streak profile code in its canonical GSP- form. */
export function normalizeGlobalStreakProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSP-")) return clean;
  return `GSP-${clean.replaceAll(" ", "-")}`;
}

export function globalStreakProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
