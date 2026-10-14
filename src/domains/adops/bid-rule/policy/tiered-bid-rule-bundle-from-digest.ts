import { frequencyDigestBucket } from "../../frequency/claim/frequency-digest-policy.js";
import { FrequencyDigest } from "../../frequency/claim/frequency-digest.js";
import { TieredBidRuleBundle, newTieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

export function summarizeFrequencyDigestsForBundle(items: FrequencyDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveTieredBidRuleBundlesFromDigest(items: FrequencyDigest[]): TieredBidRuleBundle[] {
  const out: TieredBidRuleBundle[] = [];
  for (const item of items) {
    const derived = newTieredBidRuleBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredBidRuleBundle(item: TieredBidRuleBundle): string {
  return frequencyDigestBucket(item.netLoad());
}
