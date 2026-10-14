import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a preference group code in its canonical PG- form. */
export function normalizePreferenceGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PG-")) return clean;
  return `PG-${clean.replaceAll(" ", "-")}`;
}

export function preferenceGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function mergePreferenceGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a preference group score falls in. */
export function classifyPreferenceGroup(score: number): string {
  if (score < 28.8) return "watch";
  if (score < 33.6) return "critical";
  return "minimal";
}
