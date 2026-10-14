import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict creative slot score falls in. */
export function classifyStrictCreativeSlot(score: number): string {
  if (score < 6.4) return "low";
  if (score < 16.2) return "high";
  if (score < 17.9) return "ok";
  if (score < 23.9) return "elevated";
  return "watch";
}

export function strictCreativeSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a strict creative slot code in its canonical SCS- form. */
export function normalizeStrictCreativeSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCS-")) return clean;
  return `SCS-${clean.replaceAll(" ", "-")}`;
}

export function mergeStrictCreativeSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
