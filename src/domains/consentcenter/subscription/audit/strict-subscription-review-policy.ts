import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictSubscriptionReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict subscription review code in its canonical SSR- form. */
export function normalizeStrictSubscriptionReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SSR-")) return clean;
  return `SSR-${clean.replaceAll(" ", "-")}`;
}

export function strictSubscriptionReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictSubscriptionReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
