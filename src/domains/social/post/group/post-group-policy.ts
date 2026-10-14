import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a post group score falls in. */
export function classifyPostGroup(score: number): string {
  if (score < 2.8) return "low";
  if (score < 3.3) return "watch";
  if (score < 41.8) return "high";
  return "ok";
}

export function mergePostGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a post group code in its canonical PG- form. */
export function normalizePostGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PG-")) return clean;
  return `PG-${clean.replaceAll(" ", "-")}`;
}
