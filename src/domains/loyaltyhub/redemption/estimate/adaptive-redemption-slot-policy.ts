import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a adaptive redemption slot code in its canonical ARS- form. */
export function normalizeAdaptiveRedemptionSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ARS-")) return clean;
  return `ARS-${clean.replaceAll(" ", "-")}`;
}

export function mergeAdaptiveRedemptionSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
