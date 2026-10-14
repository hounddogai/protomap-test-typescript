import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeFunnelReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a funnel review code in its canonical FR- form. */
export function normalizeFunnelReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FR-")) return clean;
  return `FR-${clean.replaceAll(" ", "-")}`;
}

export function funnelReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
