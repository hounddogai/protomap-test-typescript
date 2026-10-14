import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a level manifest score falls in. */
export function classifyLevelManifest(score: number): string {
  if (score < 10.3) return "high";
  if (score < 27.9) return "critical";
  if (score < 48.5) return "watch";
  return "ok";
}

/** Puts a level manifest code in its canonical LM- form. */
export function normalizeLevelManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LM-")) return clean;
  return `LM-${clean.replaceAll(" ", "-")}`;
}

export function mergeLevelManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function levelManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
