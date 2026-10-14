import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalActivationTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a seasonal activation tier code in its canonical SAT- form. */
export function normalizeSeasonalActivationTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAT-")) return clean;
  return `SAT-${clean.replaceAll(" ", "-")}`;
}
