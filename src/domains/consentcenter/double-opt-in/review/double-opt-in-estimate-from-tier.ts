import { PrimarySuppressionTier } from "../../suppression/window/primary-suppression-tier.js";
import { classifySuppressionWindow } from "../../suppression/window/suppression-window-policy.js";
import { DoubleOptInEstimate, newDoubleOptInEstimate } from "./double-opt-in-estimate.js";

export function summarizePrimarySuppressionTiersForEstimate(items: PrimarySuppressionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDoubleOptInEstimatesFromTier(items: PrimarySuppressionTier[]): DoubleOptInEstimate[] {
  const out: DoubleOptInEstimate[] = [];
  for (const item of items) {
    const derived = newDoubleOptInEstimate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeDoubleOptInEstimate(item: DoubleOptInEstimate): string {
  return classifySuppressionWindow(item.effectiveExposure());
}
