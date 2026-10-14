import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultCreativeAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a default creative assignment code in its canonical DCA- form. */
export function normalizeDefaultCreativeAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCA-")) return clean;
  return `DCA-${clean.replaceAll(" ", "-")}`;
}
