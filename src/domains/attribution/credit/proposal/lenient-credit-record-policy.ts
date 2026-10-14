import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a lenient credit record code in its canonical LCR- form. */
export function normalizeLenientCreditRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCR-")) return clean;
  return `LCR-${clean.replaceAll(" ", "-")}`;
}

export function lenientCreditRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeLenientCreditRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a lenient credit record score falls in. */
export function classifyLenientCreditRecord(score: number): string {
  if (score < 8.8) return "high";
  if (score < 45.8) return "watch";
  return "medium";
}
