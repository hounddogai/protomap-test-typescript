import { FallbackFraudCheckScore } from "../../fraud-check/variance/fallback-fraud-check-score.js";
import { classifyFraudCheckVariance } from "../../fraud-check/variance/fraud-check-variance-policy.js";
import { PayoutRule, newPayoutRule } from "./payout-rule.js";

export function summarizeFallbackFraudCheckScoresForRule(items: FallbackFraudCheckScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePayoutRulesFromScore(items: FallbackFraudCheckScore[]): PayoutRule[] {
  const out: PayoutRule[] = [];
  for (const item of items) {
    const derived = newPayoutRule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePayoutRule(item: PayoutRule): string {
  return classifyFraudCheckVariance(item.weightedVolume());
}
