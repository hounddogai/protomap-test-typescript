import {
  normalizeBatchedFrequencyCycleCode,
} from "../../frequency/frequency-cycle/batched-frequency-cycle-policy.js";
import { CappedFrequencySlot } from "../../frequency/frequency-cycle/capped-frequency-slot.js";
import { BidRuleVariance, newBidRuleVariance } from "./bid-rule-variance.js";

export function summarizeCappedFrequencySlotsForVariance(items: CappedFrequencySlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveBidRuleVariancesFromSlot(items: CappedFrequencySlot[]): BidRuleVariance[] {
  const out: BidRuleVariance[] = [];
  for (const item of items) {
    const derived = newBidRuleVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBidRuleVariance(item: BidRuleVariance): string {
  return normalizeBatchedFrequencyCycleCode(item.code);
}
