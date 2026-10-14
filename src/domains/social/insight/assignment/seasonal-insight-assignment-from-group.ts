import { BatchedApprovalGroup } from "../../approval/group/batched-approval-group.js";
import { normalizeRegionalApprovalGroupCode } from "../../approval/group/regional-approval-group-policy.js";
import { SeasonalInsightAssignment, newSeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

export function summarizeBatchedApprovalGroupsForAssignment(items: BatchedApprovalGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSeasonalInsightAssignmentsFromGroup(items: BatchedApprovalGroup[]): SeasonalInsightAssignment[] {
  const out: SeasonalInsightAssignment[] = [];
  for (const item of items) {
    const derived = newSeasonalInsightAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalInsightAssignment(item: SeasonalInsightAssignment): string {
  return normalizeRegionalApprovalGroupCode(item.code);
}
