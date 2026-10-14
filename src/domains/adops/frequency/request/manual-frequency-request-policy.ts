import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeManualFrequencyRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a manual frequency request code in its canonical MFR- form. */
export function normalizeManualFrequencyRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFR-")) return clean;
  return `MFR-${clean.replaceAll(" ", "-")}`;
}

export function manualFrequencyRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualFrequencyRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
