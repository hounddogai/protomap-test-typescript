import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function manualBadgeQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a manual badge quota score falls in. */
export function classifyManualBadgeQuota(score: number): string {
  if (score < 12.2) return "high";
  if (score < 83.1) return "ok";
  if (score < 93.5) return "medium";
  return "elevated";
}

export function mergeManualBadgeQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
