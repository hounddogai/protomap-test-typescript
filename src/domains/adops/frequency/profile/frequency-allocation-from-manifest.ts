import { classifyPendingBidRuleManifest } from "../../bid-rule/baseline/pending-bid-rule-manifest-policy.js";
import { PendingBidRuleManifest } from "../../bid-rule/baseline/pending-bid-rule-manifest.js";
import { FrequencyAllocation, newFrequencyAllocation } from "./frequency-allocation.js";

export function summarizePendingBidRuleManifestsForAllocation(items: PendingBidRuleManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFrequencyAllocationsFromManifest(items: PendingBidRuleManifest[]): FrequencyAllocation[] {
  const out: FrequencyAllocation[] = [];
  for (const item of items) {
    const derived = newFrequencyAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankFrequencyAllocation(item: FrequencyAllocation): string {
  return classifyPendingBidRuleManifest(item.adjustedExposure());
}
