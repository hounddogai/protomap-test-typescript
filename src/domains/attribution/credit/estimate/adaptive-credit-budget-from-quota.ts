import { RollingWindowQuota } from "../../window/window-review/rolling-window-quota.js";
import { normalizeWindowTierCode } from "../../window/window-review/window-tier-policy.js";
import { AdaptiveCreditBudget, newAdaptiveCreditBudget } from "./adaptive-credit-budget.js";

export function summarizeRollingWindowQuotasForBudget(items: RollingWindowQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveCreditBudgetsFromQuota(items: RollingWindowQuota[]): AdaptiveCreditBudget[] {
  const out: AdaptiveCreditBudget[] = [];
  for (const item of items) {
    const derived = newAdaptiveCreditBudget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeAdaptiveCreditBudget(item: AdaptiveCreditBudget): string {
  return normalizeWindowTierCode(item.code);
}
