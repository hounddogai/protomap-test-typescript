import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a global fraud check mapping code in its canonical GFCM- form. */
export function normalizeGlobalFraudCheckMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFCM-")) return clean;
  return `GFCM-${clean.replaceAll(" ", "-")}`;
}

export function mergeGlobalFraudCheckMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
