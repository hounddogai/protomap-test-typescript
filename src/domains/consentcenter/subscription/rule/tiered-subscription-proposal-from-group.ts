import { classifyAdaptiveSubscriptionWindow } from "../group/adaptive-subscription-window-policy.js";
import { SubscriptionGroup } from "../group/subscription-group.js";
import { TieredSubscriptionProposal, newTieredSubscriptionProposal } from "./tiered-subscription-proposal.js";

export function summarizeSubscriptionGroupsForProposal(items: SubscriptionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveTieredSubscriptionProposalsFromGroup(items: SubscriptionGroup[]): TieredSubscriptionProposal[] {
  const out: TieredSubscriptionProposal[] = [];
  for (const item of items) {
    const derived = newTieredSubscriptionProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredSubscriptionProposal(item: TieredSubscriptionProposal): string {
  return classifyAdaptiveSubscriptionWindow(item.effectiveValue());
}
