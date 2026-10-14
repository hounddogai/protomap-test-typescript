import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedNudgeMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a capped nudge mapping code in its canonical CNM- form. */
export function normalizeCappedNudgeMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CNM-")) return clean;
  return `CNM-${clean.replaceAll(" ", "-")}`;
}
