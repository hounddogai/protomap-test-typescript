import {
  normalizeFallbackApprovalPreferenceCode,
} from "../../approval/baseline/fallback-approval-preference-policy.js";
import { RollingApprovalWindow } from "../../approval/baseline/rolling-approval-window.js";
import { PendingInsightPlan, newPendingInsightPlan } from "./pending-insight-plan.js";

export function summarizeRollingApprovalWindowsForPlan(items: RollingApprovalWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePendingInsightPlansFromWindow(items: RollingApprovalWindow[]): PendingInsightPlan[] {
  const out: PendingInsightPlan[] = [];
  for (const item of items) {
    const derived = newPendingInsightPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computePendingInsightPlan(item: PendingInsightPlan): string {
  return normalizeFallbackApprovalPreferenceCode(item.code);
}
