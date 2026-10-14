import { classifyBidRuleAgreement } from "../agreement/bid-rule-agreement-policy.js";
import { BidRuleAgreement } from "../agreement/bid-rule-agreement.js";
import { BidRulePreference, newBidRulePreference } from "./bid-rule-preference.js";

export function summarizeBidRuleAgreementsForPreference(items: BidRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveBidRulePreferencesFromAgreement(items: BidRuleAgreement[]): BidRulePreference[] {
  const out: BidRulePreference[] = [];
  for (const item of items) {
    const derived = newBidRulePreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateBidRulePreference(item: BidRulePreference): string {
  return classifyBidRuleAgreement(item.adjustedVolume());
}
