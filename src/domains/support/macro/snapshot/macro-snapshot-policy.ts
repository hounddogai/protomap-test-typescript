import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function macroSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function mergeMacroSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a macro snapshot code in its canonical MS- form. */
export function normalizeMacroSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MS-")) return clean;
  return `MS-${clean.replaceAll(" ", "-")}`;
}
