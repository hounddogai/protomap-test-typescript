import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a domain batch score falls in. */
export function classifyDomainBatch(score: number): string {
  if (score < 21.6) return "elevated";
  if (score < 84.2) return "watch";
  if (score < 87) return "critical";
  return "high";
}

export function mergeDomainBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function domainBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
