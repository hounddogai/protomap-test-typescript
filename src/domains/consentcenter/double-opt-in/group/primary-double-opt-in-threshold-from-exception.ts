import { classifyFallbackSuppressionGroup } from "../../suppression/group/fallback-suppression-group-policy.js";
import { StrictSuppressionException } from "../../suppression/group/strict-suppression-exception.js";
import { PrimaryDoubleOptInThreshold, newPrimaryDoubleOptInThreshold } from "./primary-double-opt-in-threshold.js";

export function summarizeStrictSuppressionExceptionsForThreshold(items: StrictSuppressionException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePrimaryDoubleOptInThresholdsFromException(items: StrictSuppressionException[]): PrimaryDoubleOptInThreshold[] {
  const out: PrimaryDoubleOptInThreshold[] = [];
  for (const item of items) {
    const derived = newPrimaryDoubleOptInThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePrimaryDoubleOptInThreshold(item: PrimaryDoubleOptInThreshold): string {
  return classifyFallbackSuppressionGroup(item.effectiveExposure());
}
