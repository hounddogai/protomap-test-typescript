import { BatchedCreditLedger } from "../../credit/reservation/batched-credit-ledger.js";
import { creditAdjustmentBucket } from "../../credit/reservation/credit-adjustment-policy.js";
import { GlobalModelTier, newGlobalModelTier } from "./global-model-tier.js";

export function summarizeBatchedCreditLedgersForTier(items: BatchedCreditLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveGlobalModelTiersFromLedger(items: BatchedCreditLedger[]): GlobalModelTier[] {
  const out: GlobalModelTier[] = [];
  for (const item of items) {
    const derived = newGlobalModelTier(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalModelTier(item: GlobalModelTier): string {
  return creditAdjustmentBucket(item.measuredValue());
}
