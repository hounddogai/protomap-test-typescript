import * as numbers from "../../../../kit/numbers.js";

export function cappedModelBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a capped model batch score falls in. */
export function classifyCappedModelBatch(score: number): string {
  if (score < 12.6) return "low";
  if (score < 39.5) return "critical";
  if (score < 77.2) return "watch";
  if (score < 83.4) return "elevated";
  return "medium";
}

/** Puts a capped model batch code in its canonical CMB- form. */
export function normalizeCappedModelBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CMB-")) return clean;
  return `CMB-${clean.replaceAll(" ", "-")}`;
}

export function cappedModelBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
