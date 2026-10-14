import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled flight notice score falls in. */
export function classifyScheduledFlightNotice(score: number): string {
  if (score < 21.6) return "watch";
  if (score < 95.9) return "ok";
  return "high";
}

export function mergeScheduledFlightNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function scheduledFlightNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
