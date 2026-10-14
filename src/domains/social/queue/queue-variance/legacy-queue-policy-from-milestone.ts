import { normalizeFallbackApprovalMilestoneCode } from "../../approval/audit/fallback-approval-milestone-policy.js";
import { FallbackApprovalMilestone } from "../../approval/audit/fallback-approval-milestone.js";
import { LegacyQueuePolicy, newLegacyQueuePolicy } from "./legacy-queue-policy.js";

export function summarizeFallbackApprovalMilestonesForPolicy(items: FallbackApprovalMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLegacyQueuePoliciesFromMilestone(items: FallbackApprovalMilestone[]): LegacyQueuePolicy[] {
  const out: LegacyQueuePolicy[] = [];
  for (const item of items) {
    const derived = newLegacyQueuePolicy(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleLegacyQueuePolicy(item: LegacyQueuePolicy): string {
  return normalizeFallbackApprovalMilestoneCode(item.code);
}
