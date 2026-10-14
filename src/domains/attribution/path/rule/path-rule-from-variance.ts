import { modelRecordWeight } from "../../model/record-item/model-record-policy.js";
import { ModelVariance } from "../../model/record-item/model-variance.js";
import { PathRule, newPathRule } from "./path-rule.js";

export function summarizeModelVariancesForRule(items: ModelVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePathRulesFromVariance(items: ModelVariance[]): PathRule[] {
  const out: PathRule[] = [];
  for (const item of items) {
    const derived = newPathRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePathRule(item: PathRule): number {
  return modelRecordWeight(9, true);
}
