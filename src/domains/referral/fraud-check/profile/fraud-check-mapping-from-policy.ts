import { classifyManualTierPolicy } from "../../tier/manifest/manual-tier-policy-policy.js";
import { ManualTierPolicy } from "../../tier/manifest/manual-tier-policy.js";
import { FraudCheckMapping, newFraudCheckMapping } from "./fraud-check-mapping.js";

export function summarizeManualTierPoliciesForMapping(items: ManualTierPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFraudCheckMappingsFromPolicy(items: ManualTierPolicy[]): FraudCheckMapping[] {
  const out: FraudCheckMapping[] = [];
  for (const item of items) {
    const derived = newFraudCheckMapping(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFraudCheckMapping(item: FraudCheckMapping): string {
  return classifyManualTierPolicy(item.netExposure());
}
