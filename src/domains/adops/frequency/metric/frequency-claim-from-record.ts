import { classifyBidRulePreference } from "../../bid-rule/manifest/bid-rule-preference-policy.js";
import { BidRuleRecord } from "../../bid-rule/manifest/bid-rule-record.js";
import { FrequencyClaim, newFrequencyClaim } from "./frequency-claim.js";

export function summarizeBidRuleRecordsForClaim(items: BidRuleRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFrequencyClaimsFromRecord(items: BidRuleRecord[]): FrequencyClaim[] {
  const out: FrequencyClaim[] = [];
  for (const item of items) {
    const derived = newFrequencyClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFrequencyClaim(item: FrequencyClaim): string {
  return classifyBidRulePreference(item.weightedVolume());
}
