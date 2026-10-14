import { classifyAdaptiveRewardRuleSummary } from "../../reward-rule/summary/adaptive-reward-rule-summary-policy.js";
import { RewardRuleSummary } from "../../reward-rule/summary/reward-rule-summary.js";
import { CappedFraudCheckClaim, newCappedFraudCheckClaim } from "./capped-fraud-check-claim.js";

export function summarizeRewardRuleSummariesForClaim(items: RewardRuleSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveCappedFraudCheckClaimsFromSummary(items: RewardRuleSummary[]): CappedFraudCheckClaim[] {
  const out: CappedFraudCheckClaim[] = [];
  for (const item of items) {
    const derived = newCappedFraudCheckClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyCappedFraudCheckClaimExtra(item: CappedFraudCheckClaim): string {
  return classifyAdaptiveRewardRuleSummary(item.measuredValue());
}
