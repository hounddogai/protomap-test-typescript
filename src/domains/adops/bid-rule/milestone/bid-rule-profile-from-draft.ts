import { BatchedFlightDraft } from "../../flight/draft/batched-flight-draft.js";
import { classifyFlightRequest } from "../../flight/draft/flight-request-policy.js";
import { BidRuleProfile, newBidRuleProfile } from "./bid-rule-profile.js";

export function summarizeBatchedFlightDraftsForProfile(items: BatchedFlightDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBidRuleProfilesFromDraft(items: BatchedFlightDraft[]): BidRuleProfile[] {
  const out: BidRuleProfile[] = [];
  for (const item of items) {
    const derived = newBidRuleProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBidRuleProfile(item: BidRuleProfile): string {
  return classifyFlightRequest(item.netExposure());
}
