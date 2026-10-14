import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a tiered step notice code in its canonical TSN- form. */
export function normalizeTieredStepNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TSN-")) return clean;
  return `TSN-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredStepNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
