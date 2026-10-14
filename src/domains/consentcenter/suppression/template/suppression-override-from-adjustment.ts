import { SuppressionAdjustment } from "../threshold/suppression-adjustment.js";
import { classifySuppressionEstimate } from "../threshold/suppression-estimate-policy.js";
import { SuppressionOverride, newSuppressionOverride } from "./suppression-override.js";

export function summarizeSuppressionAdjustmentsForOverride(items: SuppressionAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveSuppressionOverridesFromAdjustment(items: SuppressionAdjustment[]): SuppressionOverride[] {
  const out: SuppressionOverride[] = [];
  for (const item of items) {
    const derived = newSuppressionOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceSuppressionOverride(item: SuppressionOverride): string {
  return classifySuppressionEstimate(item.netLoad());
}
