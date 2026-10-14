import * as numbers from "../../../../kit/numbers.js";

/** Puts a global cohort score code in its canonical GCS- form. */
export function normalizeGlobalCohortScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCS-")) return clean;
  return `GCS-${clean.replaceAll(" ", "-")}`;
}

export function globalCohortScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function globalCohortScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a global cohort score score falls in. */
export function classifyGlobalCohortScore(score: number): string {
  if (score < 7.7) return "watch";
  if (score < 29.5) return "high";
  if (score < 55.1) return "medium";
  if (score < 85.4) return "critical";
  return "low";
}
