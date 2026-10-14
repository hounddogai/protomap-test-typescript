import { BatchedDoubleOptInPlan } from "../../double-opt-in/in-profile/batched-double-opt-in-plan.js";
import {
  tieredDoubleOptInProfileWeight,
} from "../../double-opt-in/in-profile/tiered-double-opt-in-profile-policy.js";
import { RollingOptOutMilestone, newRollingOptOutMilestone } from "./rolling-opt-out-milestone.js";

export function summarizeBatchedDoubleOptInPlansForMilestone(items: BatchedDoubleOptInPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingOptOutMilestonesFromPlan(items: BatchedDoubleOptInPlan[]): RollingOptOutMilestone[] {
  const out: RollingOptOutMilestone[] = [];
  for (const item of items) {
    const derived = newRollingOptOutMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyRollingOptOutMilestoneExtra(item: RollingOptOutMilestone): number {
  return tieredDoubleOptInProfileWeight(1, true);
}
