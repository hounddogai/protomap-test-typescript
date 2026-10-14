import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveComplaintProposal(): number {
  const policy = retry.defaultPolicy("adaptive-complaint-proposal");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 2401.0, in order. */
export function adaptiveComplaintProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2401) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeAdaptiveComplaintProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a adaptive complaint proposal score falls in. */
export function classifyAdaptiveComplaintProposal(score: number): string {
  if (score < 20.9) return "critical";
  if (score < 79.1) return "high";
  return "medium";
}
