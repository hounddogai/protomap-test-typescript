import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a pending deflection assignment code in its canonical PDA- form. */
export function normalizePendingDeflectionAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDA-")) return clean;
  return `PDA-${clean.replaceAll(" ", "-")}`;
}

export function mergePendingDeflectionAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
