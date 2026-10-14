import { FallbackRetentionTier } from "../../retention/group/fallback-retention-tier.js";
import { retentionMappingWeight } from "../../retention/group/retention-mapping-policy.js";
import { ActivationAdjustment, newActivationAdjustment } from "./activation-adjustment.js";

export function summarizeFallbackRetentionTiersForAdjustment(items: FallbackRetentionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveActivationAdjustmentsFromTier(items: FallbackRetentionTier[]): ActivationAdjustment[] {
  const out: ActivationAdjustment[] = [];
  for (const item of items) {
    const derived = newActivationAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateActivationAdjustment(item: ActivationAdjustment): number {
  return retentionMappingWeight(2, true);
}
