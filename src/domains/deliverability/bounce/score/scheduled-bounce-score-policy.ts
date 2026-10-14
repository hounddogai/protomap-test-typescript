import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled bounce score code in its canonical SBS- form. */
export function normalizeScheduledBounceScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBS-")) return clean;
  return `SBS-${clean.replaceAll(" ", "-")}`;
}

export function scheduledBounceScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function scheduledBounceScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
