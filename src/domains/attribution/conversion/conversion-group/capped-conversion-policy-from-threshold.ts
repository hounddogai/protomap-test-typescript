import { TieredConversionThreshold } from "../conversion-threshold/tiered-conversion-threshold.js";
import { weightedConversionAuditWeight } from "../conversion-threshold/weighted-conversion-audit-policy.js";
import { CappedConversionPolicy, newCappedConversionPolicy } from "./capped-conversion-policy.js";

export function summarizeTieredConversionThresholdsForPolicy(items: TieredConversionThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveCappedConversionPoliciesFromThreshold(items: TieredConversionThreshold[]): CappedConversionPolicy[] {
  const out: CappedConversionPolicy[] = [];
  for (const item of items) {
    const derived = newCappedConversionPolicy(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeCappedConversionPolicy(item: CappedConversionPolicy): number {
  return weightedConversionAuditWeight(4, true);
}
