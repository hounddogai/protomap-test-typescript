import { normalizeFallbackBidRuleWindowCode } from "../window/fallback-bid-rule-window-policy.js";
import { GlobalBidRuleRequest } from "../window/global-bid-rule-request.js";
import { AdaptiveBidRuleBudget, newAdaptiveBidRuleBudget } from "./adaptive-bid-rule-budget.js";

export function summarizeGlobalBidRuleRequestsForBudget(items: GlobalBidRuleRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveAdaptiveBidRuleBudgetsFromRequest(items: GlobalBidRuleRequest[]): AdaptiveBidRuleBudget[] {
  const out: AdaptiveBidRuleBudget[] = [];
  for (const item of items) {
    const derived = newAdaptiveBidRuleBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptiveBidRuleBudget(item: AdaptiveBidRuleBudget): string {
  return normalizeFallbackBidRuleWindowCode(item.code);
}
