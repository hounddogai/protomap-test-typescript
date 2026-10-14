import {
  defaultSubscriptionCycleWeight,
} from "../../subscription/subscription-slot/default-subscription-cycle-policy.js";
import { LegacySubscriptionSlot } from "../../subscription/subscription-slot/legacy-subscription-slot.js";
import { LegacyOptOutBudget, newLegacyOptOutBudget } from "./legacy-opt-out-budget.js";

export function summarizeLegacySubscriptionSlotsForBudget(items: LegacySubscriptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveLegacyOptOutBudgetsFromSlot(items: LegacySubscriptionSlot[]): LegacyOptOutBudget[] {
  const out: LegacyOptOutBudget[] = [];
  for (const item of items) {
    const derived = newLegacyOptOutBudget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveLegacyOptOutBudget(item: LegacyOptOutBudget): number {
  return defaultSubscriptionCycleWeight(7, true);
}
