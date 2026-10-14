import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeWindowDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function windowDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a window digest code in its canonical WD- form. */
export function normalizeWindowDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WD-")) return clean;
  return `WD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a window digest score falls in. */
export function classifyWindowDigest(score: number): string {
  if (score < 2.4) return "elevated";
  if (score < 16.5) return "watch";
  if (score < 69.9) return "critical";
  if (score < 71.6) return "minimal";
  return "medium";
}
