import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSubscriptionTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a subscription tier code in its canonical ST- form. */
export function normalizeSubscriptionTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ST-")) return clean;
  return `ST-${clean.replaceAll(" ", "-")}`;
}
