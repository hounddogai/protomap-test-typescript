import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a macro proposal code in its canonical MP- form. */
export function normalizeMacroProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MP-")) return clean;
  return `MP-${clean.replaceAll(" ", "-")}`;
}

export function mergeMacroProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
