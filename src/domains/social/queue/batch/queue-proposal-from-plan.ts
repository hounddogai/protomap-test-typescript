import { normalizePrimaryInsightPlanCode } from "../../insight/review/primary-insight-plan-policy.js";
import { PrimaryInsightPlan } from "../../insight/review/primary-insight-plan.js";
import { QueueProposal, newQueueProposal } from "./queue-proposal.js";

export function summarizePrimaryInsightPlansForProposal(items: PrimaryInsightPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveQueueProposalsFromPlan(items: PrimaryInsightPlan[]): QueueProposal[] {
  const out: QueueProposal[] = [];
  for (const item of items) {
    const derived = newQueueProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitQueueProposal(item: QueueProposal): string {
  return normalizePrimaryInsightPlanCode(item.code);
}
