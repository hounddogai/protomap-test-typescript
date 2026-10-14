import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function tieredWindowPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered window preference code in its canonical TWP- form. */
export function normalizeTieredWindowPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TWP-")) return clean;
  return `TWP-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredWindowPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
