import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSuppressionAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a suppression assignment code in its canonical SA- form. */
export function normalizeSuppressionAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SA-")) return clean;
  return `SA-${clean.replaceAll(" ", "-")}`;
}
