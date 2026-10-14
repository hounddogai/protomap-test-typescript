import { ReputationGroup } from "../../reputation/reputation-digest/reputation-group.js";
import { reputationPlanWeight } from "../../reputation/reputation-digest/reputation-plan-policy.js";
import { PendingComplaintBundle, newPendingComplaintBundle } from "./pending-complaint-bundle.js";

export function summarizeReputationGroupsForBundle(items: ReputationGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingComplaintBundlesFromGroup(items: ReputationGroup[]): PendingComplaintBundle[] {
  const out: PendingComplaintBundle[] = [];
  for (const item of items) {
    const derived = newPendingComplaintBundle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingComplaintBundle(item: PendingComplaintBundle): number {
  return reputationPlanWeight(2, true);
}
