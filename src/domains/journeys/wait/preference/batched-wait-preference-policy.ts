import * as numbers from "../../../../kit/numbers.js";

export function batchedWaitPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function batchedWaitPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a batched wait preference score falls in. */
export function classifyBatchedWaitPreference(score: number): string {
  if (score < 13.1) return "elevated";
  if (score < 35.7) return "low";
  if (score < 81.4) return "ok";
  if (score < 94.4) return "critical";
  return "watch";
}

/** Puts a batched wait preference code in its canonical BWP- form. */
export function normalizeBatchedWaitPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWP-")) return clean;
  return `BWP-${clean.replaceAll(" ", "-")}`;
}
