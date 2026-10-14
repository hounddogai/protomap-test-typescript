import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeJourneyTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a journey tier code in its canonical JT- form. */
export function normalizeJourneyTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JT-")) return clean;
  return `JT-${clean.replaceAll(" ", "-")}`;
}
