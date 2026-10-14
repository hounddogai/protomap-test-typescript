import { classifyAdaptiveProofDraft } from "../../proof/budget/adaptive-proof-draft-policy.js";
import { AdaptiveProofDraft } from "../../proof/budget/adaptive-proof-draft.js";
import { SubscriptionProposal, newSubscriptionProposal } from "./subscription-proposal.js";

export function summarizeAdaptiveProofDraftsForProposal(items: AdaptiveProofDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSubscriptionProposalsFromDraft(items: AdaptiveProofDraft[]): SubscriptionProposal[] {
  const out: SubscriptionProposal[] = [];
  for (const item of items) {
    const derived = newSubscriptionProposal(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateSubscriptionProposal(item: SubscriptionProposal): string {
  return classifyAdaptiveProofDraft(item.adjustedVolume());
}
