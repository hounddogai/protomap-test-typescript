import { classifyTierSegment } from "../../tier/record-item/tier-segment-policy.js";
import { TierSegment } from "../../tier/record-item/tier-segment.js";
import { ManualFraudCheckWindow, newManualFraudCheckWindow } from "./manual-fraud-check-window.js";

export function summarizeTierSegmentsForWindow(items: TierSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveManualFraudCheckWindowsFromSegment(items: TierSegment[]): ManualFraudCheckWindow[] {
  const out: ManualFraudCheckWindow[] = [];
  for (const item of items) {
    const derived = newManualFraudCheckWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveManualFraudCheckWindow(item: ManualFraudCheckWindow): string {
  return classifyTierSegment(item.effectiveValue());
}
