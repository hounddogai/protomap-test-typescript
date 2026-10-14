import { FallbackApprovalMilestone } from "../../approval/audit/fallback-approval-milestone.js";
import { pendingApprovalAuditWeight } from "../../approval/audit/pending-approval-audit-policy.js";
import { SeasonalInsightPreference, newSeasonalInsightPreference } from "./seasonal-insight-preference.js";

export function summarizeFallbackApprovalMilestonesForPreference(items: FallbackApprovalMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveSeasonalInsightPreferencesFromMilestone(items: FallbackApprovalMilestone[]): SeasonalInsightPreference[] {
  const out: SeasonalInsightPreference[] = [];
  for (const item of items) {
    const derived = newSeasonalInsightPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySeasonalInsightPreference(item: SeasonalInsightPreference): number {
  return pendingApprovalAuditWeight(3, true);
}
