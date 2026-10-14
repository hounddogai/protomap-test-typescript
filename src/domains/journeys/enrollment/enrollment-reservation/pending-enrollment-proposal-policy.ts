import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function pendingEnrollmentProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a pending enrollment proposal score falls in. */
export function classifyPendingEnrollmentProposal(score: number): string {
  if (score < 20.9) return "minimal";
  if (score < 49.9) return "elevated";
  if (score < 56) return "medium";
  return "watch";
}

export function mergePendingEnrollmentProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pendingEnrollmentProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
