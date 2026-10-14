import { journeyDraftWeight } from "../../journey/draft/journey-draft-policy.js";
import { JourneyDraft } from "../../journey/draft/journey-draft.js";
import { BatchedStepProposal, newBatchedStepProposal } from "./batched-step-proposal.js";

export function summarizeJourneyDraftsForProposal(items: JourneyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedStepProposalsFromDraft(items: JourneyDraft[]): BatchedStepProposal[] {
  const out: BatchedStepProposal[] = [];
  for (const item of items) {
    const derived = newBatchedStepProposal(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedStepProposal(item: BatchedStepProposal): number {
  return journeyDraftWeight(2, true);
}
