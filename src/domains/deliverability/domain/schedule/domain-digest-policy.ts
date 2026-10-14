import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function domainDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeDomainDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function domainDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a domain digest score falls in. */
export function classifyDomainDigest(score: number): string {
  if (score < 2.8) return "high";
  if (score < 5.8) return "watch";
  return "minimal";
}
