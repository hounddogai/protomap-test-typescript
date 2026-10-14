import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a lenient tier mapping code in its canonical LTM- form. */
export function normalizeLenientTierMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LTM-")) return clean;
  return `LTM-${clean.replaceAll(" ", "-")}`;
}

export function mergeLenientTierMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function lenientTierMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientTierMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
