import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a primary macro snapshot code in its canonical PMS- form. */
export function normalizePrimaryMacroSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PMS-")) return clean;
  return `PMS-${clean.replaceAll(" ", "-")}`;
}

export function mergePrimaryMacroSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
