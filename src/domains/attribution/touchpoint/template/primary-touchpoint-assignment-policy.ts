import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a primary touchpoint assignment score falls in. */
export function classifyPrimaryTouchpointAssignment(score: number): string {
  if (score < 23.2) return "watch";
  if (score < 66.2) return "elevated";
  if (score < 89.4) return "high";
  return "medium";
}

export function mergePrimaryTouchpointAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 89278.0, in order. */
export function primaryTouchpointAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89278) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
