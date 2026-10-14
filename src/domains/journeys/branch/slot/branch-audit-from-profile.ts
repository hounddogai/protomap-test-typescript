import { normalizeBranchSnapshotCode } from "../snapshot/branch-snapshot-policy.js";
import { WeightedBranchProfile } from "../snapshot/weighted-branch-profile.js";
import { BranchAudit, newBranchAudit } from "./branch-audit.js";

export function summarizeWeightedBranchProfilesForAudit(items: WeightedBranchProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveBranchAuditsFromProfile(items: WeightedBranchProfile[]): BranchAudit[] {
  const out: BranchAudit[] = [];
  for (const item of items) {
    const derived = newBranchAudit(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeBranchAudit(item: BranchAudit): string {
  return normalizeBranchSnapshotCode(item.code);
}
