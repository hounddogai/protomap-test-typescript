import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a weighted placement slot code in its canonical WPS- form. */
export function normalizeWeightedPlacementSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPS-")) return clean;
  return `WPS-${clean.replaceAll(" ", "-")}`;
}

export function weightedPlacementSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a weighted placement slot score falls in. */
export function classifyWeightedPlacementSlot(score: number): string {
  if (score < 18.5) return "ok";
  if (score < 56.3) return "watch";
  if (score < 59.6) return "medium";
  if (score < 83) return "minimal";
  return "high";
}

export function mergeWeightedPlacementSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
