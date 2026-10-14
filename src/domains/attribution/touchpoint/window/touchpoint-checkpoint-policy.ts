import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTouchpointCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function touchpointCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a touchpoint checkpoint code in its canonical TC- form. */
export function normalizeTouchpointCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TC-")) return clean;
  return `TC-${clean.replaceAll(" ", "-")}`;
}
