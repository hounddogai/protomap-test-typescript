import { CappedCreativeBudget } from "../../creative/notice/capped-creative-budget.js";
import { creativeTemplateBucket } from "../../creative/notice/creative-template-policy.js";
import { TieredPlacementThreshold, newTieredPlacementThreshold } from "./tiered-placement-threshold.js";

export function summarizeCappedCreativeBudgetsForThreshold(items: CappedCreativeBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTieredPlacementThresholdsFromBudget(items: CappedCreativeBudget[]): TieredPlacementThreshold[] {
  const out: TieredPlacementThreshold[] = [];
  for (const item of items) {
    const derived = newTieredPlacementThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyTieredPlacementThreshold(item: TieredPlacementThreshold): string {
  return creativeTemplateBucket(item.measuredValue());
}
