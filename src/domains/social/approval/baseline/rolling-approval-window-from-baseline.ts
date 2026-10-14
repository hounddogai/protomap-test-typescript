import { globalInsightProfileWeight } from "../../insight/profile/global-insight-profile-policy.js";
import { InsightBaseline } from "../../insight/profile/insight-baseline.js";
import { RollingApprovalWindow, newRollingApprovalWindow } from "./rolling-approval-window.js";

export function summarizeInsightBaselinesForWindow(items: InsightBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingApprovalWindowsFromBaseline(items: InsightBaseline[]): RollingApprovalWindow[] {
  const out: RollingApprovalWindow[] = [];
  for (const item of items) {
    const derived = newRollingApprovalWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitRollingApprovalWindow(item: RollingApprovalWindow): number {
  return globalInsightProfileWeight(2, true);
}
