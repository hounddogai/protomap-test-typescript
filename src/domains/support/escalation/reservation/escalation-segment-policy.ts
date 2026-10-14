import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 34028.0, in order. */
export function escalationSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34028) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function escalationSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeEscalationSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a escalation segment score falls in. */
export function classifyEscalationSegment(score: number): string {
  if (score < 2.1) return "high";
  if (score < 67.8) return "critical";
  if (score < 75.7) return "medium";
  return "low";
}
