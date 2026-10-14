import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictRedemptionScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function strictRedemptionScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict redemption score code in its canonical SRS- form. */
export function normalizeStrictRedemptionScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRS-")) return clean;
  return `SRS-${clean.replaceAll(" ", "-")}`;
}
