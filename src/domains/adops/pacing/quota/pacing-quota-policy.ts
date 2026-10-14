import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function pacingQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function mergePacingQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a pacing quota score falls in. */
export function classifyPacingQuota(score: number): string {
  if (score < 14.2) return "critical";
  if (score < 49.1) return "watch";
  if (score < 60.4) return "high";
  if (score < 98.1) return "low";
  return "medium";
}

/** Puts a pacing quota code in its canonical PQ- form. */
export function normalizePacingQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PQ-")) return clean;
  return `PQ-${clean.replaceAll(" ", "-")}`;
}
