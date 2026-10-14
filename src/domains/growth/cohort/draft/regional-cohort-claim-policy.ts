import * as numbers from "../../../../kit/numbers.js";

/** Names the band a regional cohort claim score falls in. */
export function classifyRegionalCohortClaim(score: number): string {
  if (score < 13.3) return "critical";
  if (score < 59) return "medium";
  if (score < 85.8) return "low";
  if (score < 95.1) return "watch";
  return "minimal";
}

export function regionalCohortClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function regionalCohortClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a regional cohort claim code in its canonical RCC- form. */
export function normalizeRegionalCohortClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCC-")) return clean;
  return `RCC-${clean.replaceAll(" ", "-")}`;
}
