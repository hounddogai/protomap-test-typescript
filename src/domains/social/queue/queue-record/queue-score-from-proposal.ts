import { batchedPostOverrideWeight } from "../../post/post-proposal/batched-post-override-policy.js";
import { RegionalPostProposal } from "../../post/post-proposal/regional-post-proposal.js";
import { QueueScore, newQueueScore } from "./queue-score.js";

export function summarizeRegionalPostProposalsForScore(items: RegionalPostProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveQueueScoresFromProposal(items: RegionalPostProposal[]): QueueScore[] {
  const out: QueueScore[] = [];
  for (const item of items) {
    const derived = newQueueScore(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeQueueScore(item: QueueScore): number {
  return batchedPostOverrideWeight(7, true);
}
