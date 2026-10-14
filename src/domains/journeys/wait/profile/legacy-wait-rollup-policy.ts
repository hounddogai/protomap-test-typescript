import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyWaitRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a legacy wait rollup code in its canonical LWR- form. */
export function normalizeLegacyWaitRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWR-")) return clean;
  return `LWR-${clean.replaceAll(" ", "-")}`;
}
