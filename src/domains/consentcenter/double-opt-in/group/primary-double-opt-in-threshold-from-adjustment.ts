import { AdaptiveOptOutAdjustment } from "../../opt-out/request/adaptive-opt-out-adjustment.js";
import { classifyCappedOptOutRequest } from "../../opt-out/request/capped-opt-out-request-policy.js";
import { PrimaryDoubleOptInThreshold, newPrimaryDoubleOptInThreshold } from "./primary-double-opt-in-threshold.js";

export function summarizeAdaptiveOptOutAdjustmentsForThreshold(items: AdaptiveOptOutAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePrimaryDoubleOptInThresholdsFromAdjustment(items: AdaptiveOptOutAdjustment[]): PrimaryDoubleOptInThreshold[] {
  const out: PrimaryDoubleOptInThreshold[] = [];
  for (const item of items) {
    const derived = newPrimaryDoubleOptInThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimatePrimaryDoubleOptInThreshold(item: PrimaryDoubleOptInThreshold): string {
  return classifyCappedOptOutRequest(item.effectiveExposure());
}
