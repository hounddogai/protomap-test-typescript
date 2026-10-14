import { normalizePendingExitRuleRecordCode } from "../../exit-rule/adjustment/pending-exit-rule-record-policy.js";
import { PendingExitRuleRecord } from "../../exit-rule/adjustment/pending-exit-rule-record.js";
import { LenientBranchCycle, newLenientBranchCycle } from "./lenient-branch-cycle.js";

export function summarizePendingExitRuleRecordsForCycle(items: PendingExitRuleRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveLenientBranchCyclesFromRecord(items: PendingExitRuleRecord[]): LenientBranchCycle[] {
  const out: LenientBranchCycle[] = [];
  for (const item of items) {
    const derived = newLenientBranchCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchLenientBranchCycle(item: LenientBranchCycle): string {
  return normalizePendingExitRuleRecordCode(item.code);
}
