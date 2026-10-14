import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLevelQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a level quota code in its canonical LQ- form. */
export function normalizeLevelQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LQ-")) return clean;
  return `LQ-${clean.replaceAll(" ", "-")}`;
}
