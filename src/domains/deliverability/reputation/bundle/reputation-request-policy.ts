import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeReputationRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a reputation request score falls in. */
export function classifyReputationRequest(score: number): string {
  if (score < 4.3) return "medium";
  if (score < 9.7) return "high";
  if (score < 49.7) return "critical";
  if (score < 57.9) return "ok";
  return "watch";
}

export function reputationRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
