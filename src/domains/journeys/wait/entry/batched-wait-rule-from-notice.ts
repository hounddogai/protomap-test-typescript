import { classifyExitRuleSegment } from "../../exit-rule/threshold/exit-rule-segment-policy.js";
import { RegionalExitRuleNotice } from "../../exit-rule/threshold/regional-exit-rule-notice.js";
import { BatchedWaitRule, newBatchedWaitRule } from "./batched-wait-rule.js";

export function summarizeRegionalExitRuleNoticesForRule(items: RegionalExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveBatchedWaitRulesFromNotice(items: RegionalExitRuleNotice[]): BatchedWaitRule[] {
  const out: BatchedWaitRule[] = [];
  for (const item of items) {
    const derived = newBatchedWaitRule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyBatchedWaitRule(item: BatchedWaitRule): string {
  return classifyExitRuleSegment(item.projectedTotal());
}
