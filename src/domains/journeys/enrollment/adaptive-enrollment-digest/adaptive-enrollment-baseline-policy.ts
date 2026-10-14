import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a adaptive enrollment baseline code in its canonical AEB- form. */
export function normalizeAdaptiveEnrollmentBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AEB-")) return clean;
  return `AEB-${clean.replaceAll(" ", "-")}`;
}

export function mergeAdaptiveEnrollmentBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function adaptiveEnrollmentBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a adaptive enrollment baseline score falls in. */
export function classifyAdaptiveEnrollmentBaseline(score: number): string {
  if (score < 22.5) return "ok";
  if (score < 63.1) return "minimal";
  return "watch";
}
