import { PendingConversionTarget } from "../../conversion/conversion-threshold/pending-conversion-target.js";
import {
  normalizeTieredConversionThresholdCode,
} from "../../conversion/conversion-threshold/tiered-conversion-threshold-policy.js";
import { FallbackModelBudget, newFallbackModelBudget } from "./fallback-model-budget.js";

export function summarizePendingConversionTargetsForBudget(items: PendingConversionTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveFallbackModelBudgetsFromTarget(items: PendingConversionTarget[]): FallbackModelBudget[] {
  const out: FallbackModelBudget[] = [];
  for (const item of items) {
    const derived = newFallbackModelBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyFallbackModelBudget(item: FallbackModelBudget): string {
  return normalizeTieredConversionThresholdCode(item.code);
}
