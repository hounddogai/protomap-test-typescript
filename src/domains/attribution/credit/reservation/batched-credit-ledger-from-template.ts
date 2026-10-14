import { pathTemplateWeight } from "../../path/claim/path-template-policy.js";
import { PathTemplate } from "../../path/claim/path-template.js";
import { BatchedCreditLedger, newBatchedCreditLedger } from "./batched-credit-ledger.js";

export function summarizePathTemplatesForLedger(items: PathTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBatchedCreditLedgersFromTemplate(items: PathTemplate[]): BatchedCreditLedger[] {
  const out: BatchedCreditLedger[] = [];
  for (const item of items) {
    const derived = newBatchedCreditLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitBatchedCreditLedger(item: BatchedCreditLedger): number {
  return pathTemplateWeight(8, true);
}
