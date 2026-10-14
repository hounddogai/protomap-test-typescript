import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a fallback approval quota score falls in. */
export function classifyFallbackApprovalQuota(score: number): string {
  if (score < 8) return "high";
  if (score < 36.6) return "elevated";
  if (score < 73) return "minimal";
  return "low";
}

export function fallbackApprovalQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function mergeFallbackApprovalQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
