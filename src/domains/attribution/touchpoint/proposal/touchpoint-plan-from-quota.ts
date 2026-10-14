import { normalizeSeasonalWindowAuditCode } from "../../window/reservation/seasonal-window-audit-policy.js";
import { WindowQuota } from "../../window/reservation/window-quota.js";
import { TouchpointPlan, newTouchpointPlan } from "./touchpoint-plan.js";

export function summarizeWindowQuotasForPlan(items: WindowQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveTouchpointPlansFromQuota(items: WindowQuota[]): TouchpointPlan[] {
  const out: TouchpointPlan[] = [];
  for (const item of items) {
    const derived = newTouchpointPlan(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTouchpointPlan(item: TouchpointPlan): string {
  return normalizeSeasonalWindowAuditCode(item.code);
}
