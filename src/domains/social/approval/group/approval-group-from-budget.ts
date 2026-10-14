import { normalizeApprovalBudgetCode } from "../threshold/approval-budget-policy.js";
import { ApprovalBudget } from "../threshold/approval-budget.js";
import { ApprovalGroup, newApprovalGroup } from "./approval-group.js";

export function summarizeApprovalBudgetsForGroup(items: ApprovalBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveApprovalGroupsFromBudget(items: ApprovalBudget[]): ApprovalGroup[] {
  const out: ApprovalGroup[] = [];
  for (const item of items) {
    const derived = newApprovalGroup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeApprovalGroup(item: ApprovalGroup): string {
  return normalizeApprovalBudgetCode(item.code);
}
