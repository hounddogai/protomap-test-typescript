import { AdaptiveFrequencyGroup } from "../../frequency/digest/adaptive-frequency-group.js";
import { classifyFrequencySummary } from "../../frequency/digest/frequency-summary-policy.js";
import { RegionalBidRuleLedger, newRegionalBidRuleLedger } from "./regional-bid-rule-ledger.js";

export function summarizeAdaptiveFrequencyGroupsForLedger(items: AdaptiveFrequencyGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRegionalBidRuleLedgersFromGroup(items: AdaptiveFrequencyGroup[]): RegionalBidRuleLedger[] {
  const out: RegionalBidRuleLedger[] = [];
  for (const item of items) {
    const derived = newRegionalBidRuleLedger(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectRegionalBidRuleLedger(item: RegionalBidRuleLedger): string {
  return classifyFrequencySummary(item.effectiveExposure());
}
