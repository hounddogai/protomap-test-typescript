import { AdaptiveTierRecord } from "../../tier/tier-entry/adaptive-tier-record.js";
import { globalTierEntryWeight } from "../../tier/tier-entry/global-tier-entry-policy.js";
import { ManualRewardRuleAgreement, newManualRewardRuleAgreement } from "./manual-reward-rule-agreement.js";

export function summarizeAdaptiveTierRecordsForAgreement(items: AdaptiveTierRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveManualRewardRuleAgreementsFromRecord(items: AdaptiveTierRecord[]): ManualRewardRuleAgreement[] {
  const out: ManualRewardRuleAgreement[] = [];
  for (const item of items) {
    const derived = newManualRewardRuleAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualRewardRuleAgreement(item: ManualRewardRuleAgreement): number {
  return globalTierEntryWeight(3, true);
}
