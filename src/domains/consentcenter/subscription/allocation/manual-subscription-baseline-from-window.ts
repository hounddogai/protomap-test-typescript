import { classifySuppressionWindow } from "../../suppression/window/suppression-window-policy.js";
import { SuppressionWindow } from "../../suppression/window/suppression-window.js";
import { ManualSubscriptionBaseline, newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

export function summarizeSuppressionWindowsForBaseline(items: SuppressionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveManualSubscriptionBaselinesFromWindow(items: SuppressionWindow[]): ManualSubscriptionBaseline[] {
  const out: ManualSubscriptionBaseline[] = [];
  for (const item of items) {
    const derived = newManualSubscriptionBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeManualSubscriptionBaseline(item: ManualSubscriptionBaseline): string {
  return classifySuppressionWindow(item.measuredValue());
}
