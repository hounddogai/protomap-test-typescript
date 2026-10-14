import { payoutBatchWeight } from "../../payout/allocation/payout-batch-policy.js";
import { PayoutBatch } from "../../payout/allocation/payout-batch.js";
import { AdaptiveRewardRuleSummary, newAdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

export function summarizePayoutBatchesForSummary(items: PayoutBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveAdaptiveRewardRuleSummariesFromBatch(items: PayoutBatch[]): AdaptiveRewardRuleSummary[] {
  const out: AdaptiveRewardRuleSummary[] = [];
  for (const item of items) {
    const derived = newAdaptiveRewardRuleSummary(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeAdaptiveRewardRuleSummary(item: AdaptiveRewardRuleSummary): number {
  return payoutBatchWeight(3, true);
}
