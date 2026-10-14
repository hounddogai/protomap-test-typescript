import { normalizePlacementAuditCode } from "../../placement/estimate/placement-audit-policy.js";
import { PlacementEstimate } from "../../placement/estimate/placement-estimate.js";
import { RollingBidRulePreference, newRollingBidRulePreference } from "./rolling-bid-rule-preference.js";

export function summarizePlacementEstimatesForPreference(items: PlacementEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRollingBidRulePreferencesFromEstimate(items: PlacementEstimate[]): RollingBidRulePreference[] {
  const out: RollingBidRulePreference[] = [];
  for (const item of items) {
    const derived = newRollingBidRulePreference(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRollingBidRulePreference(item: RollingBidRulePreference): string {
  return normalizePlacementAuditCode(item.code);
}
