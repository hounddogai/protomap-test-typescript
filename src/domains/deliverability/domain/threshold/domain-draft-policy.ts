import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function domainDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function mergeDomainDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a domain draft score falls in. */
export function classifyDomainDraft(score: number): string {
  if (score < 21.9) return "low";
  if (score < 26.7) return "elevated";
  if (score < 34.3) return "watch";
  if (score < 37.6) return "minimal";
  return "ok";
}
