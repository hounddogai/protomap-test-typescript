import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a subscription baseline code in its canonical SB- form. */
export function normalizeSubscriptionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SB-")) return clean;
  return `SB-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a subscription baseline score falls in. */
export function classifySubscriptionBaseline(score: number): string {
  if (score < 20.7) return "minimal";
  if (score < 57.6) return "low";
  if (score < 67.3) return "high";
  if (score < 97) return "elevated";
  return "medium";
}

export function mergeSubscriptionBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
