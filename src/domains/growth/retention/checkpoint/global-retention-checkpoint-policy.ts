import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global retention checkpoint score falls in. */
export function classifyGlobalRetentionCheckpoint(score: number): string {
  if (score < 8.6) return "high";
  if (score < 86.5) return "elevated";
  return "minimal";
}

export function mergeGlobalRetentionCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function globalRetentionCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a global retention checkpoint code in its canonical GRC- form. */
export function normalizeGlobalRetentionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRC-")) return clean;
  return `GRC-${clean.replaceAll(" ", "-")}`;
}
