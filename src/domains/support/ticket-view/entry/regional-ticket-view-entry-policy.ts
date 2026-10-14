import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function regionalTicketViewEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeRegionalTicketViewEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalTicketViewEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a regional ticket view entry score falls in. */
export function classifyRegionalTicketViewEntry(score: number): string {
  if (score < 36.5) return "high";
  if (score < 42.6) return "medium";
  if (score < 55) return "minimal";
  return "low";
}
