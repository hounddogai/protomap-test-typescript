import { pendingSubscriptionNoticeWeight } from "../../subscription/plan/pending-subscription-notice-policy.js";
import { SubscriptionSlot } from "../../subscription/plan/subscription-slot.js";
import { AdaptiveProofDraft, newAdaptiveProofDraft } from "./adaptive-proof-draft.js";

export function summarizeSubscriptionSlotsForDraft(items: SubscriptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveAdaptiveProofDraftsFromSlot(items: SubscriptionSlot[]): AdaptiveProofDraft[] {
  const out: AdaptiveProofDraft[] = [];
  for (const item of items) {
    const derived = newAdaptiveProofDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateAdaptiveProofDraft(item: AdaptiveProofDraft): number {
  return pendingSubscriptionNoticeWeight(4, true);
}
