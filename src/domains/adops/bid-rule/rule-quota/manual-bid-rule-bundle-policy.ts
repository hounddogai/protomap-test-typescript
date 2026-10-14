import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual bid rule bundle score falls in. */
export function classifyManualBidRuleBundle(score: number): string {
  if (score < 2.3) return "high";
  if (score < 32.2) return "ok";
  return "critical";
}

export function manualBidRuleBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeManualBidRuleBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
