import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedDomainBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a weighted domain bundle score falls in. */
export function classifyWeightedDomainBundle(score: number): string {
  if (score < 45) return "low";
  if (score < 68.2) return "ok";
  if (score < 72.9) return "watch";
  return "minimal";
}

export function weightedDomainBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
