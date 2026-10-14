import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledDomainScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a scheduled domain score code in its canonical SDS- form. */
export function normalizeScheduledDomainScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDS-")) return clean;
  return `SDS-${clean.replaceAll(" ", "-")}`;
}
