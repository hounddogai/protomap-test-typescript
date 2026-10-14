import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientJourneyGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient journey group code in its canonical LJG- form. */
export function normalizeLenientJourneyGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LJG-")) return clean;
  return `LJG-${clean.replaceAll(" ", "-")}`;
}

export function lenientJourneyGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
