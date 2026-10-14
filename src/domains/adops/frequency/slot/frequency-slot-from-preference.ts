import { bidRuleMetricBucket } from "../../bid-rule/metric/bid-rule-metric-policy.js";
import { LenientBidRulePreference } from "../../bid-rule/metric/lenient-bid-rule-preference.js";
import { FrequencySlot, newFrequencySlot } from "./frequency-slot.js";

export function summarizeLenientBidRulePreferencesForSlot(items: LenientBidRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveFrequencySlotsFromPreference(items: LenientBidRulePreference[]): FrequencySlot[] {
  const out: FrequencySlot[] = [];
  for (const item of items) {
    const derived = newFrequencySlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFrequencySlot(item: FrequencySlot): string {
  return bidRuleMetricBucket(item.netValue());
}
