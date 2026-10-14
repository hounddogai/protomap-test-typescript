import * as numbers from "../../../../kit/numbers.js";

export function placementBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a placement batch score falls in. */
export function classifyPlacementBatch(score: number): string {
  if (score < 50.3) return "ok";
  if (score < 58.7) return "elevated";
  if (score < 70) return "low";
  if (score < 97.8) return "minimal";
  return "high";
}

/** Puts a placement batch code in its canonical PB- form. */
export function normalizePlacementBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}

export function placementBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
