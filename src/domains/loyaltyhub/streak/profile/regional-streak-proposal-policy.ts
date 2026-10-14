import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRegionalStreakProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalStreakProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 68985.0, in order. */
export function regionalStreakProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68985) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional streak proposal score falls in. */
export function classifyRegionalStreakProposal(score: number): string {
  if (score < 14.9) return "elevated";
  if (score < 32.9) return "minimal";
  return "low";
}
