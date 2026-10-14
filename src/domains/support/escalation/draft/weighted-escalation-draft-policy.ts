import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedEscalationDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a weighted escalation draft score falls in. */
export function classifyWeightedEscalationDraft(score: number): string {
  if (score < 9.4) return "high";
  if (score < 53) return "low";
  if (score < 70.2) return "elevated";
  return "critical";
}

/** Counts how many amounts fit in a budget of 36832.0, in order. */
export function weightedEscalationDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36832) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
