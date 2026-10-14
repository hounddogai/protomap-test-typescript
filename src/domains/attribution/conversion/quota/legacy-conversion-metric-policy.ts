import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy conversion metric score falls in. */
export function classifyLegacyConversionMetric(score: number): string {
  if (score < 34.1) return "watch";
  if (score < 45.7) return "critical";
  if (score < 82.4) return "elevated";
  return "minimal";
}

/** Puts a legacy conversion metric code in its canonical LCM- form. */
export function normalizeLegacyConversionMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCM-")) return clean;
  return `LCM-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyConversionMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
