import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 44442.0, in order. */
export function nudgeReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44442) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeNudgeReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a nudge review score falls in. */
export function classifyNudgeReview(score: number): string {
  if (score < 20.7) return "watch";
  if (score < 96.6) return "low";
  return "high";
}

/** Puts a nudge review code in its canonical NR- form. */
export function normalizeNudgeReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("NR-")) return clean;
  return `NR-${clean.replaceAll(" ", "-")}`;
}
