import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual bounce draft score falls in. */
export function classifyManualBounceDraft(score: number): string {
  if (score < 5.6) return "minimal";
  if (score < 10.9) return "high";
  if (score < 33.7) return "critical";
  return "ok";
}

/** Puts a manual bounce draft code in its canonical MBD- form. */
export function normalizeManualBounceDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MBD-")) return clean;
  return `MBD-${clean.replaceAll(" ", "-")}`;
}

export function manualBounceDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function manualBounceDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
