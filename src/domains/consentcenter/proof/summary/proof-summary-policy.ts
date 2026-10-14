import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function proofSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a proof summary score falls in. */
export function classifyProofSummary(score: number): string {
  if (score < 3.1) return "low";
  if (score < 29.1) return "minimal";
  if (score < 79.7) return "ok";
  if (score < 88) return "high";
  return "critical";
}

export function mergeProofSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
