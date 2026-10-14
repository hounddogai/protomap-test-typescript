import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling sender quota code in its canonical RSQ- form. */
export function normalizeRollingSenderQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSQ-")) return clean;
  return `RSQ-${clean.replaceAll(" ", "-")}`;
}

export function mergeRollingSenderQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
