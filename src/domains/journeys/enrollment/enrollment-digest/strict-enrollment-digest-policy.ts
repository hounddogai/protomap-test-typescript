import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict enrollment digest score falls in. */
export function classifyStrictEnrollmentDigest(score: number): string {
  if (score < 4.7) return "critical";
  if (score < 29.5) return "low";
  if (score < 47.4) return "elevated";
  if (score < 55.1) return "ok";
  return "minimal";
}

export function strictEnrollmentDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeStrictEnrollmentDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
