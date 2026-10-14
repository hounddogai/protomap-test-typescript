import { classifyPacingEntry } from "../../pacing/rollup/pacing-entry-policy.js";
import { PacingEntry } from "../../pacing/rollup/pacing-entry.js";
import { BidRuleEstimate, newBidRuleEstimate } from "./bid-rule-estimate.js";

export function summarizePacingEntriesForEstimate(items: PacingEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveBidRuleEstimatesFromEntry(items: PacingEntry[]): BidRuleEstimate[] {
  const out: BidRuleEstimate[] = [];
  for (const item of items) {
    const derived = newBidRuleEstimate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignBidRuleEstimate(item: BidRuleEstimate): string {
  return classifyPacingEntry(item.netLoad());
}
