import { classifyCappedPayoutQuota } from "../../payout/preference/capped-payout-quota-policy.js";
import { PayoutPreference } from "../../payout/preference/payout-preference.js";
import { GlobalFraudCheckMapping, newGlobalFraudCheckMapping } from "./global-fraud-check-mapping.js";

export function summarizePayoutPreferencesForMapping(items: PayoutPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveGlobalFraudCheckMappingsFromPreference(items: PayoutPreference[]): GlobalFraudCheckMapping[] {
  const out: GlobalFraudCheckMapping[] = [];
  for (const item of items) {
    const derived = newGlobalFraudCheckMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeGlobalFraudCheckMapping(item: GlobalFraudCheckMapping): string {
  return classifyCappedPayoutQuota(item.effectiveTotal());
}
