import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function seasonalDoubleOptInAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeSeasonalDoubleOptInAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a seasonal double opt in audit score falls in. */
export function classifySeasonalDoubleOptInAudit(score: number): string {
  if (score < 48.3) return "elevated";
  if (score < 90) return "watch";
  return "minimal";
}

export function seasonalDoubleOptInAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
