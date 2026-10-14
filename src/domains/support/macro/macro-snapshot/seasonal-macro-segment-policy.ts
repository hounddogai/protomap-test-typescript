import * as numbers from "../../../../kit/numbers.js";

/** Puts a seasonal macro segment code in its canonical SMS- form. */
export function normalizeSeasonalMacroSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMS-")) return clean;
  return `SMS-${clean.replaceAll(" ", "-")}`;
}

export function seasonalMacroSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a seasonal macro segment score falls in. */
export function classifySeasonalMacroSegment(score: number): string {
  if (score < 16.5) return "watch";
  if (score < 30.4) return "low";
  if (score < 38.6) return "minimal";
  if (score < 97.4) return "elevated";
  return "high";
}

export function seasonalMacroSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
