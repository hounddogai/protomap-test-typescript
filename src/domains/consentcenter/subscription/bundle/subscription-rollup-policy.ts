import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeSubscriptionRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function subscriptionRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 37764.0, in order. */
export function subscriptionRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37764) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a subscription rollup code in its canonical SR- form. */
export function normalizeSubscriptionRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}
