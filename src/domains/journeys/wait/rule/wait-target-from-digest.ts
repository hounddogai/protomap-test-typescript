import { branchBundleBucket } from "../../branch/bundle/branch-bundle-policy.js";
import { BranchDigest } from "../../branch/bundle/branch-digest.js";
import { WaitTarget, newWaitTarget } from "./wait-target.js";

export function summarizeBranchDigestsForTarget(items: BranchDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveWaitTargetsFromDigest(items: BranchDigest[]): WaitTarget[] {
  const out: WaitTarget[] = [];
  for (const item of items) {
    const derived = newWaitTarget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyWaitTarget(item: WaitTarget): string {
  return branchBundleBucket(item.measuredValue());
}
