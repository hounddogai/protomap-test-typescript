import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientSenderDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 99521.0, in order. */
export function lenientSenderDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99521) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient sender digest score falls in. */
export function classifyLenientSenderDigest(score: number): string {
  if (score < 1.6) return "watch";
  if (score < 14.5) return "high";
  if (score < 19.5) return "elevated";
  if (score < 49.3) return "medium";
  return "critical";
}
