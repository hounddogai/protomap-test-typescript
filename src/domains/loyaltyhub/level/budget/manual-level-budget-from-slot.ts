import { DefaultBadgeSlot } from "../../badge/global-badge-digest/default-badge-slot.js";
import { classifyPrimaryBadgeBaseline } from "../../badge/global-badge-digest/primary-badge-baseline-policy.js";
import { ManualLevelBudget, newManualLevelBudget } from "./manual-level-budget.js";

export function summarizeDefaultBadgeSlotsForBudget(items: DefaultBadgeSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveManualLevelBudgetsFromSlot(items: DefaultBadgeSlot[]): ManualLevelBudget[] {
  const out: ManualLevelBudget[] = [];
  for (const item of items) {
    const derived = newManualLevelBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualLevelBudget(item: ManualLevelBudget): string {
  return classifyPrimaryBadgeBaseline(item.projectedTotal());
}
