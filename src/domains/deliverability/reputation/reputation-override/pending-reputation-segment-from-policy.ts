import { lenientComplaintBudgetWeight } from "../../complaint/complaint-metric/lenient-complaint-budget-policy.js";
import { RollingComplaintPolicy } from "../../complaint/complaint-metric/rolling-complaint-policy.js";
import { PendingReputationSegment, newPendingReputationSegment } from "./pending-reputation-segment.js";

export function summarizeRollingComplaintPoliciesForSegment(items: RollingComplaintPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePendingReputationSegmentsFromPolicy(items: RollingComplaintPolicy[]): PendingReputationSegment[] {
  const out: PendingReputationSegment[] = [];
  for (const item of items) {
    const derived = newPendingReputationSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planPendingReputationSegment(item: PendingReputationSegment): number {
  return lenientComplaintBudgetWeight(8, true);
}
