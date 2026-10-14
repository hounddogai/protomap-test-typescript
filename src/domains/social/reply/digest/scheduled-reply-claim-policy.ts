import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled reply claim score falls in. */
export function classifyScheduledReplyClaim(score: number): string {
  if (score < 38) return "low";
  if (score < 73.7) return "high";
  if (score < 75.5) return "watch";
  return "elevated";
}

/** Puts a scheduled reply claim code in its canonical SRC- form. */
export function normalizeScheduledReplyClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRC-")) return clean;
  return `SRC-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledReplyClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function scheduledReplyClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
