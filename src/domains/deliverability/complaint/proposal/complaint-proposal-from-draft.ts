import { globalComplaintDraftBucket } from "../window/global-complaint-draft-policy.js";
import { GlobalComplaintDraft } from "../window/global-complaint-draft.js";
import { ComplaintProposal, newComplaintProposal } from "./complaint-proposal.js";

export function summarizeGlobalComplaintDraftsForProposal(items: GlobalComplaintDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveComplaintProposalsFromDraft(items: GlobalComplaintDraft[]): ComplaintProposal[] {
  const out: ComplaintProposal[] = [];
  for (const item of items) {
    const derived = newComplaintProposal(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planComplaintProposal(item: ComplaintProposal): string {
  return globalComplaintDraftBucket(item.weightedTotal());
}
