import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeDomainRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a domain request score falls in. */
export function classifyDomainRequest(score: number): string {
  if (score < 60.4) return "elevated";
  if (score < 67.8) return "watch";
  if (score < 71.2) return "high";
  if (score < 71.7) return "minimal";
  return "medium";
}

export function domainRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
