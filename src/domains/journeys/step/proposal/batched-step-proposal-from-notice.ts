import { scheduledExitRuleNoticeWeight } from "../../exit-rule/baseline/scheduled-exit-rule-notice-policy.js";
import { ScheduledExitRuleNotice } from "../../exit-rule/baseline/scheduled-exit-rule-notice.js";
import { BatchedStepProposal, newBatchedStepProposal } from "./batched-step-proposal.js";

export function summarizeScheduledExitRuleNoticesForProposal(items: ScheduledExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedStepProposalsFromNotice(items: ScheduledExitRuleNotice[]): BatchedStepProposal[] {
  const out: BatchedStepProposal[] = [];
  for (const item of items) {
    const derived = newBatchedStepProposal(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchBatchedStepProposal(item: BatchedStepProposal): number {
  return scheduledExitRuleNoticeWeight(1, true);
}
