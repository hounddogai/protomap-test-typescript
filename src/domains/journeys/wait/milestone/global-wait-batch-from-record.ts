import { BatchedExitRuleRecord } from "../../exit-rule/ledger/batched-exit-rule-record.js";
import { normalizeExitRuleLedgerCode } from "../../exit-rule/ledger/exit-rule-ledger-policy.js";
import { GlobalWaitBatch, newGlobalWaitBatch } from "./global-wait-batch.js";

export function summarizeBatchedExitRuleRecordsForBatch(items: BatchedExitRuleRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveGlobalWaitBatchesFromRecord(items: BatchedExitRuleRecord[]): GlobalWaitBatch[] {
  const out: GlobalWaitBatch[] = [];
  for (const item of items) {
    const derived = newGlobalWaitBatch(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignGlobalWaitBatch(item: GlobalWaitBatch): string {
  return normalizeExitRuleLedgerCode(item.code);
}
