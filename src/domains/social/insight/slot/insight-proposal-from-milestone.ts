import { classifyManualQueuePreference } from "../../queue/milestone/manual-queue-preference-policy.js";
import { QueueMilestone } from "../../queue/milestone/queue-milestone.js";
import { InsightProposal, newInsightProposal } from "./insight-proposal.js";

export function summarizeQueueMilestonesForProposal(items: QueueMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveInsightProposalsFromMilestone(items: QueueMilestone[]): InsightProposal[] {
  const out: InsightProposal[] = [];
  for (const item of items) {
    const derived = newInsightProposal(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankInsightProposal(item: InsightProposal): string {
  return classifyManualQueuePreference(item.measuredValue());
}
