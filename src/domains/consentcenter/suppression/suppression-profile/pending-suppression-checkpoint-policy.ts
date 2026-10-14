import * as numbers from "../../../../kit/numbers.js";

/** Names the band a pending suppression checkpoint score falls in. */
export function classifyPendingSuppressionCheckpoint(score: number): string {
  if (score < 27.8) return "minimal";
  if (score < 93.9) return "medium";
  if (score < 99.2) return "critical";
  return "elevated";
}

export function pendingSuppressionCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function pendingSuppressionCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
