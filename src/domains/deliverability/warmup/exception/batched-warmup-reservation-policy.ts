import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedWarmupReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedWarmupReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a batched warmup reservation score falls in. */
export function classifyBatchedWarmupReservation(score: number): string {
  if (score < 25.4) return "ok";
  if (score < 37.2) return "high";
  if (score < 44.2) return "critical";
  return "low";
}
