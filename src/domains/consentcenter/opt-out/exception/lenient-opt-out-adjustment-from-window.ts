import { StrictSubscriptionWindow } from "../../subscription/subscription-window/strict-subscription-window.js";
import { classifySubscriptionBudget } from "../../subscription/subscription-window/subscription-budget-policy.js";
import { LenientOptOutAdjustment, newLenientOptOutAdjustment } from "./lenient-opt-out-adjustment.js";

export function summarizeStrictSubscriptionWindowsForAdjustment(items: StrictSubscriptionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLenientOptOutAdjustmentsFromWindow(items: StrictSubscriptionWindow[]): LenientOptOutAdjustment[] {
  const out: LenientOptOutAdjustment[] = [];
  for (const item of items) {
    const derived = newLenientOptOutAdjustment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateLenientOptOutAdjustment(item: LenientOptOutAdjustment): string {
  return classifySubscriptionBudget(item.effectiveVolume());
}
