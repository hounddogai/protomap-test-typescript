import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a badge variance code in its canonical BV- form. */
export function normalizeBadgeVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BV-")) return clean;
  return `BV-${clean.replaceAll(" ", "-")}`;
}

export function badgeVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeBadgeVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
