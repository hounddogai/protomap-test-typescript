import { GlobalExitRuleBundle } from "../bundle/global-exit-rule-bundle.js";
import { normalizeRollingExitRuleLedgerCode } from "../bundle/rolling-exit-rule-ledger-policy.js";
import { BatchedExitRuleTier, newBatchedExitRuleTier } from "./batched-exit-rule-tier.js";

export function summarizeGlobalExitRuleBundlesForTier(items: GlobalExitRuleBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBatchedExitRuleTiersFromBundle(items: GlobalExitRuleBundle[]): BatchedExitRuleTier[] {
  const out: BatchedExitRuleTier[] = [];
  for (const item of items) {
    const derived = newBatchedExitRuleTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBatchedExitRuleTier(item: BatchedExitRuleTier): string {
  return normalizeRollingExitRuleLedgerCode(item.code);
}
