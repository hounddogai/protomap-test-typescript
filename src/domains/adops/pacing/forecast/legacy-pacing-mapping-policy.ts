import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyPacingMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a legacy pacing mapping code in its canonical LPM- form. */
export function normalizeLegacyPacingMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPM-")) return clean;
  return `LPM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy pacing mapping score falls in. */
export function classifyLegacyPacingMapping(score: number): string {
  if (score < 8.1) return "elevated";
  if (score < 65.7) return "ok";
  if (score < 77.6) return "low";
  return "medium";
}

export function legacyPacingMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
