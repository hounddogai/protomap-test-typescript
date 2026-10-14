import { normalizeAdaptiveBidRuleBudgetCode } from "../budget/adaptive-bid-rule-budget-policy.js";
import { BidRuleRollup } from "../budget/bid-rule-rollup.js";
import { DefaultBidRuleSummary, newDefaultBidRuleSummary } from "./default-bid-rule-summary.js";

export function summarizeBidRuleRollupsForSummary(items: BidRuleRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDefaultBidRuleSummariesFromRollup(items: BidRuleRollup[]): DefaultBidRuleSummary[] {
  const out: DefaultBidRuleSummary[] = [];
  for (const item of items) {
    const derived = newDefaultBidRuleSummary(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyDefaultBidRuleSummary(item: DefaultBidRuleSummary): string {
  return normalizeAdaptiveBidRuleBudgetCode(item.code);
}
