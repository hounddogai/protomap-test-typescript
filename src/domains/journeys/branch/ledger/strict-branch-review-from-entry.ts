import { branchAllocationWeight } from "../template/branch-allocation-policy.js";
import { StrictBranchEntry } from "../template/strict-branch-entry.js";
import { StrictBranchReview, newStrictBranchReview } from "./strict-branch-review.js";

export function summarizeStrictBranchEntriesForReview(items: StrictBranchEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStrictBranchReviewsFromEntry(items: StrictBranchEntry[]): StrictBranchReview[] {
  const out: StrictBranchReview[] = [];
  for (const item of items) {
    const derived = newStrictBranchReview(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateStrictBranchReview(item: StrictBranchReview): number {
  return branchAllocationWeight(9, true);
}
