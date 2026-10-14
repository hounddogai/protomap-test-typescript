import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeEscalationBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function escalationBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a escalation budget score falls in. */
export function classifyEscalationBudget(score: number): string {
  if (score < 44.1) return "elevated";
  if (score < 91.5) return "medium";
  return "watch";
}
