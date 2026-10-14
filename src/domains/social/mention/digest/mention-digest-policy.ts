import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mentionDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function mergeMentionDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a mention digest score falls in. */
export function classifyMentionDigest(score: number): string {
  if (score < 30.1) return "watch";
  if (score < 31.7) return "medium";
  if (score < 54.2) return "high";
  if (score < 60.9) return "minimal";
  return "elevated";
}

export function mentionDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
