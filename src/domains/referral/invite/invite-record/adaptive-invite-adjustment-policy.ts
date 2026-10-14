import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a adaptive invite adjustment code in its canonical AIA- form. */
export function normalizeAdaptiveInviteAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AIA-")) return clean;
  return `AIA-${clean.replaceAll(" ", "-")}`;
}

export function mergeAdaptiveInviteAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
