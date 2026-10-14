import { primaryPreferenceBaselineWeight } from "../../preference/manifest/primary-preference-baseline-policy.js";
import { PrimaryPreferenceBaseline } from "../../preference/manifest/primary-preference-baseline.js";
import { RegionalOptOutQuota, newRegionalOptOutQuota } from "./regional-opt-out-quota.js";

export function summarizePrimaryPreferenceBaselinesForQuota(items: PrimaryPreferenceBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRegionalOptOutQuotasFromBaseline(items: PrimaryPreferenceBaseline[]): RegionalOptOutQuota[] {
  const out: RegionalOptOutQuota[] = [];
  for (const item of items) {
    const derived = newRegionalOptOutQuota(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRegionalOptOutQuota(item: RegionalOptOutQuota): number {
  return primaryPreferenceBaselineWeight(8, true);
}
