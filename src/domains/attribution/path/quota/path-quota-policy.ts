import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a path quota score falls in. */
export function classifyPathQuota(score: number): string {
  if (score < 16.7) return "watch";
  if (score < 26.3) return "minimal";
  if (score < 51.2) return "low";
  return "high";
}

export function pathQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function mergePathQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a path quota code in its canonical PQ- form. */
export function normalizePathQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PQ-")) return clean;
  return `PQ-${clean.replaceAll(" ", "-")}`;
}
