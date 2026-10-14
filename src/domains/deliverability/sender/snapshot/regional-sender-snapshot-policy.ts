import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRegionalSenderSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalSenderSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function regionalSenderSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a regional sender snapshot score falls in. */
export function classifyRegionalSenderSnapshot(score: number): string {
  if (score < 11.9) return "critical";
  if (score < 28.1) return "ok";
  if (score < 49.9) return "watch";
  if (score < 70.2) return "minimal";
  return "low";
}
