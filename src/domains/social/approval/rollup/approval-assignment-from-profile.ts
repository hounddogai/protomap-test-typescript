import { insightProfileWeight } from "../../insight/insight-slot/insight-profile-policy.js";
import { InsightProfile } from "../../insight/insight-slot/insight-profile.js";
import { ApprovalAssignment, newApprovalAssignment } from "./approval-assignment.js";

export function summarizeInsightProfilesForAssignment(items: InsightProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveApprovalAssignmentsFromProfile(items: InsightProfile[]): ApprovalAssignment[] {
  const out: ApprovalAssignment[] = [];
  for (const item of items) {
    const derived = newApprovalAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeApprovalAssignment(item: ApprovalAssignment): number {
  return insightProfileWeight(9, true);
}
