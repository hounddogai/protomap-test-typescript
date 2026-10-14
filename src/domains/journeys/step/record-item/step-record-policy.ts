import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a step record score falls in. */
export function classifyStepRecord(score: number): string {
  if (score < 13.8) return "low";
  if (score < 87.1) return "watch";
  if (score < 97.9) return "minimal";
  return "critical";
}

/** Puts a step record code in its canonical SR- form. */
export function normalizeStepRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}

export function mergeStepRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
