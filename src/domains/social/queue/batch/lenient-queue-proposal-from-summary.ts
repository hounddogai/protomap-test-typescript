import { normalizeApprovalScoreCode } from "../../approval/score/approval-score-policy.js";
import { TieredApprovalSummary } from "../../approval/score/tiered-approval-summary.js";
import { LenientQueueProposal, newLenientQueueProposal } from "./lenient-queue-proposal.js";

export function summarizeTieredApprovalSummariesForProposal(items: TieredApprovalSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveLenientQueueProposalsFromSummary(items: TieredApprovalSummary[]): LenientQueueProposal[] {
  const out: LenientQueueProposal[] = [];
  for (const item of items) {
    const derived = newLenientQueueProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLenientQueueProposal(item: LenientQueueProposal): string {
  return normalizeApprovalScoreCode(item.code);
}
