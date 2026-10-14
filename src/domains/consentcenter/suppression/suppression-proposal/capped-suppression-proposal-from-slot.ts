import { pendingSubscriptionNoticeWeight } from "../../subscription/plan/pending-subscription-notice-policy.js";
import { SubscriptionSlot } from "../../subscription/plan/subscription-slot.js";
import { CappedSuppressionProposal, newCappedSuppressionProposal } from "./capped-suppression-proposal.js";

export function summarizeSubscriptionSlotsForProposal(items: SubscriptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveCappedSuppressionProposalsFromSlot(items: SubscriptionSlot[]): CappedSuppressionProposal[] {
  const out: CappedSuppressionProposal[] = [];
  for (const item of items) {
    const derived = newCappedSuppressionProposal(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateCappedSuppressionProposal(item: CappedSuppressionProposal): number {
  return pendingSubscriptionNoticeWeight(4, true);
}
