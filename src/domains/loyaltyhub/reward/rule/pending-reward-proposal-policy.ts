import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 71843.0, in order. */
export function pendingRewardProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71843) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePendingRewardProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pendingRewardProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a pending reward proposal score falls in. */
export function classifyPendingRewardProposal(score: number): string {
  if (score < 24.3) return "medium";
  if (score < 27.5) return "elevated";
  if (score < 88) return "minimal";
  if (score < 97.4) return "high";
  return "watch";
}
