import { BranchGroup } from "../../branch/policy/branch-group.js";
import { branchPolicyBucket } from "../../branch/policy/branch-policy-policy.js";
import { WaitOverride, newWaitOverride } from "./wait-override.js";

export function summarizeBranchGroupsForOverride(items: BranchGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveWaitOverridesFromGroup(items: BranchGroup[]): WaitOverride[] {
  const out: WaitOverride[] = [];
  for (const item of items) {
    const derived = newWaitOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWaitOverride(item: WaitOverride): string {
  return branchPolicyBucket(item.weightedVolume());
}
