import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedDeflectionReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedDeflectionReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a batched deflection reservation code in its canonical BDR- form. */
export function normalizeBatchedDeflectionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BDR-")) return clean;
  return `BDR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a batched deflection reservation score falls in. */
export function classifyBatchedDeflectionReservation(score: number): string {
  if (score < 61.6) return "minimal";
  if (score < 64.1) return "medium";
  return "ok";
}
