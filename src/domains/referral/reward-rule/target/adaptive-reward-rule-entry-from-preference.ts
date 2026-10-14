import { normalizePayoutPreferenceCode } from "../../payout/preference/payout-preference-policy.js";
import { PayoutPreference } from "../../payout/preference/payout-preference.js";
import { AdaptiveRewardRuleEntry, newAdaptiveRewardRuleEntry } from "./adaptive-reward-rule-entry.js";

export function summarizePayoutPreferencesForEntry(items: PayoutPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveAdaptiveRewardRuleEntriesFromPreference(items: PayoutPreference[]): AdaptiveRewardRuleEntry[] {
  const out: AdaptiveRewardRuleEntry[] = [];
  for (const item of items) {
    const derived = newAdaptiveRewardRuleEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveRewardRuleEntry(item: AdaptiveRewardRuleEntry): string {
  return normalizePayoutPreferenceCode(item.code);
}
