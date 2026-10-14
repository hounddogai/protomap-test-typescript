import * as numbers from "../../../../kit/numbers.js";

export function regionalSenderMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function regionalSenderMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a regional sender mapping score falls in. */
export function classifyRegionalSenderMapping(score: number): string {
  if (score < 25.4) return "low";
  if (score < 77) return "ok";
  if (score < 88.3) return "medium";
  return "minimal";
}

/** Puts a regional sender mapping code in its canonical RSM- form. */
export function normalizeRegionalSenderMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSM-")) return clean;
  return `RSM-${clean.replaceAll(" ", "-")}`;
}
