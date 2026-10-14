import { classifyDefaultRewardRuleBatch } from "../../reward-rule/agreement/default-reward-rule-batch-policy.js";
import { DefaultRewardRuleBatch } from "../../reward-rule/agreement/default-reward-rule-batch.js";
import { PendingPayoutLedger, newPendingPayoutLedger } from "./pending-payout-ledger.js";

export function summarizeDefaultRewardRuleBatchesForLedger(items: DefaultRewardRuleBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePendingPayoutLedgersFromBatch(items: DefaultRewardRuleBatch[]): PendingPayoutLedger[] {
  const out: PendingPayoutLedger[] = [];
  for (const item of items) {
    const derived = newPendingPayoutLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingPayoutLedger(item: PendingPayoutLedger): string {
  return classifyDefaultRewardRuleBatch(item.adjustedValue());
}
