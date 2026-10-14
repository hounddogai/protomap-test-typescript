import {
  adaptiveRewardRuleLedgerWeight,
} from "../../reward-rule/tiered-rule-preference/adaptive-reward-rule-ledger-policy.js";
import {
  WeightedRewardRulePreference,
} from "../../reward-rule/tiered-rule-preference/weighted-reward-rule-preference.js";
import { LenientPayoutLedger, newLenientPayoutLedger } from "./lenient-payout-ledger.js";

export function summarizeWeightedRewardRulePreferencesForLedger(items: WeightedRewardRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientPayoutLedgersFromPreference(items: WeightedRewardRulePreference[]): LenientPayoutLedger[] {
  const out: LenientPayoutLedger[] = [];
  for (const item of items) {
    const derived = newLenientPayoutLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLenientPayoutLedger(item: LenientPayoutLedger): number {
  return adaptiveRewardRuleLedgerWeight(3, true);
}
