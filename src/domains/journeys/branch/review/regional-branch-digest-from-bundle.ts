import { branchBundleWeight } from "../bundle/branch-bundle-policy.js";
import { BranchBundle } from "../bundle/branch-bundle.js";
import { RegionalBranchDigest, newRegionalBranchDigest } from "./regional-branch-digest.js";

export function summarizeBranchBundlesForDigest(items: BranchBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRegionalBranchDigestsFromBundle(items: BranchBundle[]): RegionalBranchDigest[] {
  const out: RegionalBranchDigest[] = [];
  for (const item of items) {
    const derived = newRegionalBranchDigest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeRegionalBranchDigest(item: RegionalBranchDigest): number {
  return branchBundleWeight(4, true);
}
