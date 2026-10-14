import { reputationDigestWeight } from "../../reputation/digest/reputation-digest-policy.js";
import { RollingReputationOverride } from "../../reputation/digest/rolling-reputation-override.js";
import { AdaptiveComplaintMapping, newAdaptiveComplaintMapping } from "./adaptive-complaint-mapping.js";

export function summarizeRollingReputationOverridesForMapping(items: RollingReputationOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveComplaintMappingsFromOverride(items: RollingReputationOverride[]): AdaptiveComplaintMapping[] {
  const out: AdaptiveComplaintMapping[] = [];
  for (const item of items) {
    const derived = newAdaptiveComplaintMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateAdaptiveComplaintMappingExtra(item: AdaptiveComplaintMapping): number {
  return reputationDigestWeight(8, true);
}
