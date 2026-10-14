import { FallbackApprovalMilestone } from "../../approval/audit/fallback-approval-milestone.js";
import { pendingApprovalAuditWeight } from "../../approval/audit/pending-approval-audit-policy.js";
import { ScheduledReplyOverride, newScheduledReplyOverride } from "./scheduled-reply-override.js";

export function summarizeFallbackApprovalMilestonesForOverride(items: FallbackApprovalMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveScheduledReplyOverridesFromMilestone(items: FallbackApprovalMilestone[]): ScheduledReplyOverride[] {
  const out: ScheduledReplyOverride[] = [];
  for (const item of items) {
    const derived = newScheduledReplyOverride(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveScheduledReplyOverride(item: ScheduledReplyOverride): number {
  return pendingApprovalAuditWeight(6, true);
}
