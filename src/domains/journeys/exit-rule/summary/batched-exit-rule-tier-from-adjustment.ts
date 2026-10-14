import { CappedWaitAdjustment } from "../../wait/window/capped-wait-adjustment.js";
import { classifyRegionalWaitEntry } from "../../wait/window/regional-wait-entry-policy.js";
import { BatchedExitRuleTier, newBatchedExitRuleTier } from "./batched-exit-rule-tier.js";

export function summarizeCappedWaitAdjustmentsForTier(items: CappedWaitAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveBatchedExitRuleTiersFromAdjustment(items: CappedWaitAdjustment[]): BatchedExitRuleTier[] {
  const out: BatchedExitRuleTier[] = [];
  for (const item of items) {
    const derived = newBatchedExitRuleTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateBatchedExitRuleTier(item: BatchedExitRuleTier): string {
  return classifyRegionalWaitEntry(item.measuredValue());
}
