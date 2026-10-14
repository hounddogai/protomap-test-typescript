import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeGlobalFrequencyProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a global frequency proposal code in its canonical GFP- form. */
export function normalizeGlobalFrequencyProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFP-")) return clean;
  return `GFP-${clean.replaceAll(" ", "-")}`;
}
