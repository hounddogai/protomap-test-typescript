import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function primaryBadgeForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function primaryBadgeForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a primary badge forecast code in its canonical PBF- form. */
export function normalizePrimaryBadgeForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBF-")) return clean;
  return `PBF-${clean.replaceAll(" ", "-")}`;
}

export function mergePrimaryBadgeForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
