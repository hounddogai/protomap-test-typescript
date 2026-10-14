import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback csat draft score falls in. */
export function classifyFallbackCsatDraft(score: number): string {
  if (score < 31.6) return "medium";
  if (score < 47) return "minimal";
  return "ok";
}

export function fallbackCsatDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a fallback csat draft code in its canonical FCD- form. */
export function normalizeFallbackCsatDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCD-")) return clean;
  return `FCD-${clean.replaceAll(" ", "-")}`;
}
