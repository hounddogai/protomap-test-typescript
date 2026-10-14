import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a streak slot score falls in. */
export function classifyStreakSlot(score: number): string {
  if (score < 7) return "watch";
  if (score < 33.7) return "elevated";
  if (score < 77.9) return "medium";
  return "ok";
}

export function mergeStreakSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a streak slot code in its canonical SS- form. */
export function normalizeStreakSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}
