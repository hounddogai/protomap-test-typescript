import { LegacyWaitCheckpoint } from "../../wait/pending-wait-policy/legacy-wait-checkpoint.js";
import { classifyWeightedWaitSlot } from "../../wait/pending-wait-policy/weighted-wait-slot-policy.js";
import { GlobalBranchMilestone, newGlobalBranchMilestone } from "./global-branch-milestone.js";

export function summarizeLegacyWaitCheckpointsForMilestone(items: LegacyWaitCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveGlobalBranchMilestonesFromCheckpoint(items: LegacyWaitCheckpoint[]): GlobalBranchMilestone[] {
  const out: GlobalBranchMilestone[] = [];
  for (const item of items) {
    const derived = newGlobalBranchMilestone(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyGlobalBranchMilestone(item: GlobalBranchMilestone): string {
  return classifyWeightedWaitSlot(item.projectedValue());
}
