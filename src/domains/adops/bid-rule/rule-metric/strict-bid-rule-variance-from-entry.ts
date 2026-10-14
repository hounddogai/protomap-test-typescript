import { normalizeCreativeRecordCode } from "../../creative/override-item/creative-record-policy.js";
import { RegionalCreativeEntry } from "../../creative/override-item/regional-creative-entry.js";
import { StrictBidRuleVariance, newStrictBidRuleVariance } from "./strict-bid-rule-variance.js";

export function summarizeRegionalCreativeEntriesForVariance(items: RegionalCreativeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStrictBidRuleVariancesFromEntry(items: RegionalCreativeEntry[]): StrictBidRuleVariance[] {
  const out: StrictBidRuleVariance[] = [];
  for (const item of items) {
    const derived = newStrictBidRuleVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateStrictBidRuleVariance(item: StrictBidRuleVariance): string {
  return normalizeCreativeRecordCode(item.code);
}
