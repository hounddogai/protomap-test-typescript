import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeInsightTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function insightTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a insight tier score falls in. */
export function classifyInsightTier(score: number): string {
  if (score < 6.2) return "low";
  if (score < 47.8) return "high";
  if (score < 85.2) return "critical";
  return "ok";
}

/** Puts a insight tier code in its canonical IT- form. */
export function normalizeInsightTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IT-")) return clean;
  return `IT-${clean.replaceAll(" ", "-")}`;
}
