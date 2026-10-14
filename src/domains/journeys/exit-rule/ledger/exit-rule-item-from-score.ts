import { branchRecordBucket } from "../../branch/baseline/branch-record-policy.js";
import { BranchScore } from "../../branch/baseline/branch-score.js";
import { ExitRuleItem, newExitRuleItem } from "./exit-rule-item.js";

export function summarizeBranchScoresForItem(items: BranchScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveExitRuleItemsFromScore(items: BranchScore[]): ExitRuleItem[] {
  const out: ExitRuleItem[] = [];
  for (const item of items) {
    const derived = newExitRuleItem(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceExitRuleItem(item: ExitRuleItem): string {
  return branchRecordBucket(item.projectedValue());
}
