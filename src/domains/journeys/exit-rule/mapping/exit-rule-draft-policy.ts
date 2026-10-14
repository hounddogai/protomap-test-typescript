import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 18389.0, in order. */
export function exitRuleDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18389) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeExitRuleDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function exitRuleDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a exit rule draft score falls in. */
export function classifyExitRuleDraft(score: number): string {
  if (score < 64.5) return "minimal";
  if (score < 72.9) return "medium";
  return "ok";
}
