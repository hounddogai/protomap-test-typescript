import { normalizeApprovalBudgetCode } from "../../approval/threshold/approval-budget-policy.js";
import { ApprovalBudget } from "../../approval/threshold/approval-budget.js";
import { DefaultPostOverride, newDefaultPostOverride } from "./default-post-override.js";

export function summarizeApprovalBudgetsForOverride(items: ApprovalBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveDefaultPostOverridesFromBudget(items: ApprovalBudget[]): DefaultPostOverride[] {
  const out: DefaultPostOverride[] = [];
  for (const item of items) {
    const derived = newDefaultPostOverride(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectDefaultPostOverride(item: DefaultPostOverride): string {
  return normalizeApprovalBudgetCode(item.code);
}
