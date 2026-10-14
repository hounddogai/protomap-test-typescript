import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictConversionSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict conversion snapshot code in its canonical SCS- form. */
export function normalizeStrictConversionSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCS-")) return clean;
  return `SCS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict conversion snapshot score falls in. */
export function classifyStrictConversionSnapshot(score: number): string {
  if (score < 15.6) return "ok";
  if (score < 28.2) return "elevated";
  if (score < 86.3) return "high";
  return "watch";
}
